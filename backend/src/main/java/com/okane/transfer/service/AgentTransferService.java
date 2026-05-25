package com.okane.transfer.service;

import com.okane.agency.entity.AgencyUser;
import com.okane.agency.repository.AgencyUserRepository;
import com.okane.auth.entity.Role;
import com.okane.auth.entity.User;
import com.okane.auth.exception.ApiException;
import com.okane.auth.repository.RoleRepository;
import com.okane.auth.repository.UserRepository;
import com.okane.auth.security.OkaneUserPrincipal;
import com.okane.cash.entity.AgentCashSession;
import com.okane.cash.entity.CashMovement;
import com.okane.cash.entity.Payout;
import com.okane.cash.repository.AgentCashSessionRepository;
import com.okane.cash.repository.CashMovementRepository;
import com.okane.cash.repository.PayoutRepository;
import com.okane.currencyfx.entity.Currency;
import com.okane.currencyfx.repository.CurrencyRepository;
import com.okane.currencyfx.repository.ExchangeRateRepository;
import com.okane.customer.entity.Customer;
import com.okane.customer.repository.CustomerRepository;
import com.okane.notification.service.AgentNotificationService;
import com.okane.transfer.dto.PayoutReceiptResponse;
import com.okane.transfer.dto.PayoutRequest;
import com.okane.transfer.dto.PayoutResponse;
import com.okane.transfer.dto.TransferCreateRequest;
import com.okane.transfer.dto.TransferResponse;
import com.okane.transfer.dto.TransferStatsResponse;
import com.okane.transfer.entity.Transfer;
import com.okane.transfer.entity.TransferStatusHistory;
import com.okane.transfer.repository.TransferRepository;
import com.okane.transfer.repository.TransferStatusHistoryRepository;
import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;
import java.util.List;
import java.util.Locale;
import java.util.Optional;
import java.util.UUID;
import org.springframework.http.HttpStatus;
import org.springframework.security.core.Authentication;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class AgentTransferService {

    private static final String DEFAULT_CURRENCY = "MAD";

    private final TransferRepository transferRepository;
    private final TransferStatusHistoryRepository statusHistoryRepository;
    private final CustomerRepository customerRepository;
    private final UserRepository userRepository;
    private final RoleRepository roleRepository;
    private final PasswordEncoder passwordEncoder;
    private final AgencyUserRepository agencyUserRepository;
    private final AgentCashSessionRepository cashSessionRepository;
    private final CashMovementRepository cashMovementRepository;
    private final PayoutRepository payoutRepository;
    private final CurrencyRepository currencyRepository;
    private final ExchangeRateRepository exchangeRateRepository;
    private final AgentNotificationService agentNotificationService;

    public AgentTransferService(
            TransferRepository transferRepository,
            TransferStatusHistoryRepository statusHistoryRepository,
            CustomerRepository customerRepository,
            UserRepository userRepository,
            RoleRepository roleRepository,
            PasswordEncoder passwordEncoder,
            AgencyUserRepository agencyUserRepository,
            AgentCashSessionRepository cashSessionRepository,
            CashMovementRepository cashMovementRepository,
            PayoutRepository payoutRepository,
            CurrencyRepository currencyRepository,
            ExchangeRateRepository exchangeRateRepository,
            AgentNotificationService agentNotificationService
    ) {
        this.transferRepository = transferRepository;
        this.statusHistoryRepository = statusHistoryRepository;
        this.customerRepository = customerRepository;
        this.userRepository = userRepository;
        this.roleRepository = roleRepository;
        this.passwordEncoder = passwordEncoder;
        this.agencyUserRepository = agencyUserRepository;
        this.cashSessionRepository = cashSessionRepository;
        this.cashMovementRepository = cashMovementRepository;
        this.payoutRepository = payoutRepository;
        this.currencyRepository = currencyRepository;
        this.exchangeRateRepository = exchangeRateRepository;
        this.agentNotificationService = agentNotificationService;
    }

    @Transactional(readOnly = true)
    public List<TransferResponse> getTransfers(Authentication authentication) {
        AgentContext context = resolveContext(authentication);
        return transferRepository.findBySourceAgency_IdOrderByCreatedAtDesc(context.agencyId)
                .stream()
                .map(transfer -> expireTransferIfNeeded(transfer, context.user))
                .map(this::toResponse)
                .toList();
    }

    @Transactional(readOnly = true)
    public List<TransferResponse> getRecentTransfers(Authentication authentication, int limit) {
        AgentContext context = resolveContext(authentication);
        List<Transfer> transfers = transferRepository.findTop4BySourceAgency_IdOrderByCreatedAtDesc(context.agencyId);
        if (limit > 0 && limit < transfers.size()) {
            transfers = transfers.subList(0, limit);
        }
        return transfers.stream()
                .map(transfer -> expireTransferIfNeeded(transfer, context.user))
                .map(this::toResponse)
                .toList();
    }

    @Transactional(readOnly = true)
    public TransferResponse searchTransfer(Authentication authentication, String reference, String phone) {
        AgentContext context = resolveContext(authentication);
        Optional<Transfer> match = Optional.empty();

        if (reference != null && !reference.isBlank()) {
            String normalized = reference.trim();
            match = transferRepository.findFirstBySourceAgency_IdAndWithdrawalCodeIgnoreCase(context.agencyId, normalized)
                    .or(() -> transferRepository.findFirstBySourceAgency_IdAndReferenceCodeIgnoreCase(context.agencyId, normalized));
        }

        if (match.isEmpty() && phone != null && !phone.isBlank()) {
            String normalizedPhone = phone.trim();
            match = transferRepository.findFirstBySourceAgency_IdAndBeneficiaryPhone(context.agencyId, normalizedPhone)
                    .or(() -> transferRepository.findFirstBySourceAgency_IdAndBeneficiary_User_Phone(context.agencyId, normalizedPhone));
        }

        Transfer transfer = match.orElse(null);
        if (transfer == null) {
            if (reference != null && !reference.isBlank()) {
                agentNotificationService.notifyInvalidWithdrawalSearch(context.user, reference.trim());
            }
            throw new ApiException(HttpStatus.NOT_FOUND, "Aucun transfert trouve.");
        }
        return toResponse(expireTransferIfNeeded(transfer, context.user));
    }

    @Transactional(readOnly = true)
    public TransferStatsResponse getStats(Authentication authentication) {
        AgentContext context = resolveContext(authentication);
        LocalDateTime start = LocalDate.now().atStartOfDay();
        LocalDateTime end = LocalDateTime.of(LocalDate.now(), LocalTime.MAX);

        int transfersToday = (int) transferRepository.countBySourceAgency_IdAndCreatedAtBetween(context.agencyId, start, end);
        int paidToday = (int) payoutRepository.countByPayoutAgency_IdAndPaidAtBetween(context.agencyId, start, end);
        int pending = (int) transferRepository.countBySourceAgency_IdAndStatusIn(
                context.agencyId,
                List.of("PENDING", "EN_ATTENTE")
        );

        double solde = computeCurrentBalance(context.userId);
        return new TransferStatsResponse(solde, transfersToday, paidToday, pending, DEFAULT_CURRENCY);
    }

    @Transactional
    public TransferResponse createTransfer(Authentication authentication, TransferCreateRequest request) {
        AgentContext context = resolveContext(authentication);
        AgentCashSession session = resolveOpenSession(context.userId);

        Currency currency = currencyRepository.findByCode(request.sourceCurrency())
                .orElseThrow(() -> new ApiException(HttpStatus.BAD_REQUEST, "Devise source inconnue."));
        Currency destinationCurrency = currencyRepository.findByCode(request.destinationCurrency())
                .orElseThrow(() -> new ApiException(HttpStatus.BAD_REQUEST, "Devise destination inconnue."));

        Customer sender = resolveOrCreateCustomer(
                request.senderFirstName(),
                request.senderLastName(),
                request.senderPhone(),
                request.senderCountry(),
                request.senderIdType(),
                request.senderIdNumber()
        );

        Customer beneficiary = resolveOrCreateCustomer(
                request.receiverFirstName(),
                request.receiverLastName(),
                request.receiverPhone(),
                request.receiverCountry(),
                request.beneficiaryDocumentType(),
                request.beneficiaryDocumentNumber()
        );

        String reference = generateUniqueReference();
        String withdrawal = generateUniqueWithdrawalCode();

        Transfer transfer = new Transfer();
        transfer.setReferenceCode(reference);
        transfer.setWithdrawalCode(withdrawal);
        transfer.setSender(sender);
        transfer.setBeneficiary(beneficiary);
        transfer.setSenderFirstName(cleanValue(request.senderFirstName()));
        transfer.setSenderLastName(cleanValue(request.senderLastName()));
        transfer.setSenderPhone(cleanValue(request.senderPhone()));
        transfer.setBeneficiaryFirstName(cleanValue(request.receiverFirstName()));
        transfer.setBeneficiaryLastName(cleanValue(request.receiverLastName()));
        transfer.setBeneficiaryPhone(cleanValue(request.receiverPhone()));
        transfer.setSourceAgency(context.agency);
        transfer.setCreatedBy(context.user);
        transfer.setCashSession(session);
        transfer.setCurrency(currency);
        transfer.setDestinationCurrency(destinationCurrency);
        transfer.setBeneficiaryDocumentType(request.beneficiaryDocumentType().trim());
        transfer.setBeneficiaryDocumentNumber(request.beneficiaryDocumentNumber().trim());
        transfer.setAmount(BigDecimal.valueOf(request.amountSent()));
        transfer.setFeeAmount(BigDecimal.valueOf(request.fees()));
        transfer.setNetAmount(BigDecimal.valueOf(request.amountReceived()));
        transfer.setExchangeRate(BigDecimal.valueOf(request.exchangeRate()));
        transfer.setStatus("PENDING");
        transfer.setSentAt(LocalDateTime.now());
        transfer.setExpiresAt(LocalDateTime.now().plusDays(7));
        transfer.setCreatedAt(LocalDateTime.now());
        transfer.setUpdatedAt(LocalDateTime.now());
        transferRepository.save(transfer);

        createStatusHistory(transfer, null, "PENDING", context.user, "Creation transfert");
        createCashMovement(session, context, transfer, null, "IN", buildTransferCashAmounts(transfer, "IN"));
        agentNotificationService.notifyTransferCreated(context.user, transfer);

        return toResponse(transfer);
    }

    @Transactional
    public PayoutResponse payoutTransfer(Authentication authentication, Long transferId, PayoutRequest request) {
        AgentContext context = resolveContext(authentication);
        Transfer transfer = null;

        try {
            transfer = resolveTransferForPayout(context, transferId, request);
            transfer = expireTransferIfNeeded(transfer, context.user);

            validateTransferCanBePaid(transfer);
            if (transfer.getId() != null && payoutRepository.existsByTransfer_Id(transfer.getId())) {
                throw new ApiException(HttpStatus.BAD_REQUEST, "Transfert deja paye.");
            }
            if (!matchesBeneficiaryIdentity(transfer, request)) {
                throw new ApiException(HttpStatus.BAD_REQUEST, "Identite beneficiaire invalide.");
            }
            AgentCashSession session = resolveOpenSession(context.userId);

            Payout payout = new Payout();
            payout.setTransfer(transfer);
            payout.setCashSession(session);
            payout.setBeneficiary(transfer.getBeneficiary());
            payout.setPayoutAgency(context.agency);
            payout.setPaidBy(context.user);
            payout.setPaidAmount(transfer.getNetAmount());
            payout.setPaidAt(LocalDateTime.now());
            payoutRepository.save(payout);

            String previousStatus = transfer.getStatus();
            transfer.setStatus("PAID");
            transfer.setUpdatedAt(LocalDateTime.now());
            transferRepository.save(transfer);
            createStatusHistory(transfer, previousStatus, "PAID", context.user, "Paiement transfert");

            createCashMovement(session, context, transfer, payout, "OUT", buildTransferCashAmounts(transfer, "OUT"));
            agentNotificationService.notifyTransferPaid(context.user, transfer);

            PayoutReceiptResponse receipt = new PayoutReceiptResponse(
                    payout.getPaidAt().toString(),
                    formatFullName(context.user),
                    context.agency.getName(),
                    requestedBeneficiaryDocumentType(request) + " " + requestedBeneficiaryDocumentNumber(request)
            );

            return new PayoutResponse(toResponse(transfer), receipt);
        } catch (ApiException ex) {
            agentNotificationService.notifyPayoutFailed(context.user, resolveReferenceForFailure(request, transfer), ex.getMessage());
            throw ex;
        }
    }

    private Transfer resolveTransferForPayout(AgentContext context, Long pathTransferId, PayoutRequest request) {
        Optional<Transfer> match = Optional.empty();

        Long requestTransferId = request != null ? request.transferId() : null;
        Long transferId = pathTransferId != null ? pathTransferId : requestTransferId;
        if (transferId != null) {
            match = transferRepository.findById(transferId);
        }

        if (match.isEmpty() && request != null && !isBlank(request.codeRetrait())) {
            match = transferRepository.findFirstBySourceAgency_IdAndWithdrawalCodeIgnoreCase(
                    context.agencyId,
                    request.codeRetrait().trim()
            );
        }

        if (match.isEmpty() && request != null && !isBlank(request.withdrawCode())) {
            match = transferRepository.findFirstBySourceAgency_IdAndWithdrawalCodeIgnoreCase(
                    context.agencyId,
                    request.withdrawCode().trim()
            );
        }

        if (match.isEmpty() && request != null && !isBlank(request.reference())) {
            String reference = request.reference().trim();
            match = transferRepository.findFirstBySourceAgency_IdAndReferenceCodeIgnoreCase(context.agencyId, reference)
                    .or(() -> transferRepository.findFirstBySourceAgency_IdAndWithdrawalCodeIgnoreCase(context.agencyId, reference));
        }

        Transfer transfer = match.orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "Transfert introuvable."));
        if (transfer.getSourceAgency() == null || !context.agencyId.equals(transfer.getSourceAgency().getId())) {
            throw new ApiException(HttpStatus.NOT_FOUND, "Transfert introuvable.");
        }
        return transfer;
    }

    private void validateTransferCanBePaid(Transfer transfer) {
        String status = transfer.getStatus();
        if ("PENDING".equalsIgnoreCase(status) || "EN_ATTENTE".equalsIgnoreCase(status)) {
            return;
        }
        if ("PAID".equalsIgnoreCase(status) || "PAYE".equalsIgnoreCase(status) || "PAYÉ".equalsIgnoreCase(status)) {
            throw new ApiException(HttpStatus.BAD_REQUEST, "Transfert deja paye.");
        }
        if ("EXPIRED".equalsIgnoreCase(status) || "EXPIRE".equalsIgnoreCase(status) || "EXPIRÉ".equalsIgnoreCase(status)) {
            throw new ApiException(HttpStatus.BAD_REQUEST, "Transfert expire.");
        }
        throw new ApiException(HttpStatus.BAD_REQUEST, "Le transfert n'est pas en attente.");
    }

    private Transfer expireTransferIfNeeded(Transfer transfer, User actor) {
        if (transfer == null || transfer.getExpiresAt() == null || transfer.getExpiresAt().isAfter(LocalDateTime.now())) {
            return transfer;
        }
        String status = transfer.getStatus();
        if ("PAID".equalsIgnoreCase(status)
                || "PAYE".equalsIgnoreCase(status)
                || "PAYÉ".equalsIgnoreCase(status)
                || "CANCELLED".equalsIgnoreCase(status)
                || "ANNULE".equalsIgnoreCase(status)
                || "ANNULÉ".equalsIgnoreCase(status)
                || "EXPIRED".equalsIgnoreCase(status)
                || "EXPIRE".equalsIgnoreCase(status)
                || "EXPIRÉ".equalsIgnoreCase(status)) {
            return transfer;
        }

        String previousStatus = transfer.getStatus();
        transfer.setStatus("EXPIRED");
        transfer.setUpdatedAt(LocalDateTime.now());
        transferRepository.save(transfer);
        createStatusHistory(transfer, previousStatus, "EXPIRED", actor, "Expiration automatique");
        agentNotificationService.notifyTransferExpired(transfer.getCreatedBy(), transfer);
        return transfer;
    }

    private AgentContext resolveContext(Authentication authentication) {
        User user = resolveUser(authentication);
        AgencyUser agencyUser = agencyUserRepository.findFirstByUser_IdAndActiveTrue(user.getId())
                .orElseThrow(() -> new ApiException(HttpStatus.BAD_REQUEST, "Agent non affecte a une agence."));
        return new AgentContext(user, agencyUser.getAgency(), agencyUser.getAgency().getId(), user.getId());
    }

    private User resolveUser(Authentication authentication) {
        if (authentication == null || !(authentication.getPrincipal() instanceof OkaneUserPrincipal principal)) {
            throw new ApiException(HttpStatus.UNAUTHORIZED, "Authentication required");
        }
        User user = principal.getUser();
        if (user == null) {
            throw new ApiException(HttpStatus.UNAUTHORIZED, "Authentication required");
        }
        return userRepository.findById(user.getId())
                .orElseThrow(() -> new ApiException(HttpStatus.UNAUTHORIZED, "Authentication required"));
    }

    private AgentCashSession resolveOpenSession(Long userId) {
        AgentCashSession session = cashSessionRepository
                .findFirstByAgent_IdAndSessionDateAndStatusIgnoreCaseOrderByOpenedAtDesc(
                        userId,
                        LocalDate.now(),
                        "OPEN"
                )
                .orElseThrow(() -> new ApiException(HttpStatus.BAD_REQUEST, "Session de caisse fermee."));
        if (!"OPEN".equalsIgnoreCase(session.getStatus())) {
            throw new ApiException(HttpStatus.BAD_REQUEST, "Session de caisse fermee.");
        }
        return session;
    }

    private Customer resolveOrCreateCustomer(
            String firstName,
            String lastName,
            String phone,
            String country,
            String identityType,
            String identityNumber
    ) {
        if (phone != null && !phone.isBlank()) {
            Optional<Customer> existing = customerRepository.findByUser_Phone(phone.trim());
            if (existing.isPresent()) {
                return existing.get();
            }
        }

        Role clientRole = roleRepository.findByName("ROLE_CLIENT")
                .orElseThrow(() -> new ApiException(HttpStatus.BAD_REQUEST, "ROLE_CLIENT manquant."));

        User user = new User();
        user.setFirstName(firstName);
        user.setLastName(lastName);
        user.setEmail(buildUniqueEmail(phone, firstName, lastName));
        user.setPhone(phone);
        user.setPasswordHash(passwordEncoder.encode(UUID.randomUUID().toString() + "@"));
        user.setEnabled(true);
        user.setAccountLocked(false);
        user.setAccountSuspended(false);
        user.setFailedLoginAttempts(0);
        user.setCreatedAt(LocalDateTime.now());
        user.setUpdatedAt(LocalDateTime.now());
        user.setPasswordChangedAt(LocalDateTime.now());
        user.setRole(clientRole);
        user = userRepository.save(user);

        Customer customer = new Customer();
        customer.setUser(user);
        customer.setCountry(country);
        customer.setIdentityType(identityType);
        customer.setIdentityNumber(identityNumber);
        customer.setCreatedAt(LocalDateTime.now());
        customer.setUpdatedAt(LocalDateTime.now());
        return customerRepository.save(customer);
    }

    private String generateUniqueReference() {
        String reference;
        do {
            reference = "TR-" + LocalDate.now() + "-" + randomCode(6);
        } while (transferRepository.existsByReferenceCode(reference));
        return reference;
    }

    private String generateUniqueWithdrawalCode() {
        String code;
        do {
            code = "OKA-" + randomCode(6);
        } while (transferRepository.existsByWithdrawalCode(code));
        return code;
    }

    private String randomCode(int size) {
        String value = UUID.randomUUID().toString().replaceAll("-", "").toUpperCase(Locale.ROOT);
        return value.substring(0, Math.min(size, value.length()));
    }

    private String generateAutoIdentity(String phone) {
        String cleaned = phone == null ? "" : phone.replaceAll("[^0-9]", "");
        if (cleaned.isBlank()) {
            cleaned = randomCode(8);
        }
        return "AUTO-" + cleaned;
    }

    private CashMovementAmounts buildTransferCashAmounts(Transfer transfer, String type) {
        String sourceCurrency = transferCurrencyCode(transfer);
        BigDecimal originalAmount = transfer.getAmount() != null ? transfer.getAmount() : BigDecimal.ZERO;
        if ("IN".equalsIgnoreCase(type) && transfer.getFeeAmount() != null) {
            originalAmount = originalAmount.add(transfer.getFeeAmount());
        }
        BigDecimal exchangeRateToMad = deriveExchangeRateToMad(sourceCurrency, transfer);
        BigDecimal amountMad = originalAmount.multiply(exchangeRateToMad).setScale(2, RoundingMode.HALF_UP);
        return new CashMovementAmounts(originalAmount, sourceCurrency, exchangeRateToMad, amountMad);
    }

    private BigDecimal deriveExchangeRateToMad(String originalCurrency, Transfer transfer) {
        if (originalCurrency == null || DEFAULT_CURRENCY.equalsIgnoreCase(originalCurrency)) {
            return BigDecimal.ONE;
        }
        if (transfer.getExchangeRate() == null || transfer.getExchangeRate().compareTo(BigDecimal.ZERO) <= 0) {
            throw new ApiException(HttpStatus.BAD_REQUEST, "Conversion caisse MAD indisponible pour cette devise.");
        }

        String sourceCurrency = transferCurrencyCode(transfer);
        String destinationCurrency = transfer.getDestinationCurrency() != null
                ? transfer.getDestinationCurrency().getCode()
                : sourceCurrency;

        if (originalCurrency.equalsIgnoreCase(sourceCurrency)
                && DEFAULT_CURRENCY.equalsIgnoreCase(destinationCurrency)) {
            return transfer.getExchangeRate();
        }
        if (originalCurrency.equalsIgnoreCase(destinationCurrency)
                && DEFAULT_CURRENCY.equalsIgnoreCase(sourceCurrency)) {
            return BigDecimal.ONE.divide(transfer.getExchangeRate(), 8, RoundingMode.HALF_UP);
        }

        return lookupExchangeRateToMad(originalCurrency)
                .orElseThrow(() -> new ApiException(
                        HttpStatus.BAD_REQUEST,
                        "Conversion caisse MAD indisponible pour cette devise."
                ));
    }

    private Optional<BigDecimal> lookupExchangeRateToMad(String originalCurrency) {
        Optional<Currency> original = currencyRepository.findByCode(originalCurrency);
        Optional<Currency> mad = currencyRepository.findByCode(DEFAULT_CURRENCY);
        if (original.isEmpty() || mad.isEmpty()) {
            return Optional.empty();
        }

        Optional<BigDecimal> direct = exchangeRateRepository
                .findByFromCurrency_IdAndToCurrency_Id(original.get().getId(), mad.get().getId())
                .filter(rate -> rate.getRate() != null)
                .map(rate -> rate.getRate().setScale(8, RoundingMode.HALF_UP));
        if (direct.isPresent()) {
            return direct;
        }

        return exchangeRateRepository
                .findByFromCurrency_IdAndToCurrency_Id(mad.get().getId(), original.get().getId())
                .filter(rate -> rate.getRate() != null && rate.getRate().compareTo(BigDecimal.ZERO) > 0)
                .map(rate -> BigDecimal.ONE.divide(rate.getRate(), 8, RoundingMode.HALF_UP));
    }

    private void createStatusHistory(Transfer transfer, String oldStatus, String newStatus, User user, String reason) {
        TransferStatusHistory history = new TransferStatusHistory();
        history.setTransfer(transfer);
        history.setOldStatus(oldStatus);
        history.setNewStatus(newStatus);
        history.setChangedBy(user);
        history.setChangedAt(LocalDateTime.now());
        history.setReason(reason);
        statusHistoryRepository.save(history);
    }

    private void createCashMovement(
            AgentCashSession session,
            AgentContext context,
            Transfer transfer,
            Payout payout,
            String type,
            CashMovementAmounts amounts
    ) {
        CashMovement movement = new CashMovement();
        movement.setCashSession(session);
        movement.setAgency(context.agency);
        movement.setUser(context.user);
        movement.setMovementType(type);
        movement.setAmount(amounts.amountMad());
        movement.setAmountOriginal(amounts.amountOriginal());
        movement.setCurrencyOriginal(amounts.currencyOriginal());
        movement.setExchangeRateToMad(amounts.exchangeRateToMad());
        movement.setAmountMad(amounts.amountMad());
        movement.setTransfer(transfer);
        movement.setPayout(payout);
        movement.setCreatedAt(LocalDateTime.now());
        movement.setDescription(type.equalsIgnoreCase("IN")
                ? "Nouveau transfert " + transfer.getReferenceCode()
                : "Paiement transfert " + transfer.getReferenceCode());
        cashMovementRepository.save(movement);
    }

    private TransferResponse toResponse(Transfer transfer) {
        Customer sender = transfer.getSender();
        Customer beneficiary = transfer.getBeneficiary();
        String createdAt = transfer.getCreatedAt() != null ? transfer.getCreatedAt().toString() : null;
        String sourceCurrency = transfer.getCurrency() != null ? transfer.getCurrency().getCode() : DEFAULT_CURRENCY;
        String destinationCurrency = transfer.getDestinationCurrency() != null
                ? transfer.getDestinationCurrency().getCode()
                : sourceCurrency;
        return new TransferResponse(
                transfer.getId() != null ? transfer.getId().toString() : null,
                transfer.getReferenceCode(),
                transfer.getWithdrawalCode(),
                transferFullName(transfer.getSenderFirstName(), transfer.getSenderLastName(), sender),
                firstNonBlank(transfer.getSenderPhone(), sender != null && sender.getUser() != null ? sender.getUser().getPhone() : null),
                transferFullName(transfer.getBeneficiaryFirstName(), transfer.getBeneficiaryLastName(), beneficiary),
                firstNonBlank(transfer.getBeneficiaryPhone(), beneficiary != null && beneficiary.getUser() != null ? beneficiary.getUser().getPhone() : null),
                transfer.getBeneficiaryDocumentType(),
                transfer.getBeneficiaryDocumentNumber(),
                transfer.getBeneficiary() != null ? transfer.getBeneficiary().getCountry() : null,
                transfer.getAmount() != null ? transfer.getAmount().doubleValue() : 0d,
                transfer.getFeeAmount() != null ? transfer.getFeeAmount().doubleValue() : 0d,
                transfer.getNetAmount() != null ? transfer.getNetAmount().doubleValue() : 0d,
                transfer.getStatus(),
                createdAt,
                sourceCurrency,
                sourceCurrency,
                destinationCurrency
        );
    }

    private boolean matchesBeneficiaryIdentity(Transfer transfer, PayoutRequest request) {
        return equalsNormalized(transfer.getBeneficiaryDocumentType(), requestedBeneficiaryDocumentType(request))
                && equalsNormalized(transfer.getBeneficiaryDocumentNumber(), requestedBeneficiaryDocumentNumber(request));
    }

    private String requestedBeneficiaryDocumentType(PayoutRequest request) {
        return firstNonBlank(
                request != null ? request.beneficiaryDocumentType() : null,
                request != null ? request.receiverIdType() : null
        );
    }

    private String requestedBeneficiaryDocumentNumber(PayoutRequest request) {
        return firstNonBlank(
                request != null ? request.beneficiaryDocumentNumber() : null,
                request != null ? request.receiverIdNumber() : null
        );
    }

    private String resolveReferenceForFailure(PayoutRequest request, Transfer transfer) {
        if (transfer != null && transfer.getReferenceCode() != null && !transfer.getReferenceCode().isBlank()) {
            return transfer.getReferenceCode();
        }
        return firstNonBlank(
                request != null ? request.reference() : null,
                request != null ? request.codeRetrait() : null
        );
    }

    private boolean equalsNormalized(String expected, String actual) {
        if (expected == null || actual == null) {
            return false;
        }
        return expected.trim().equalsIgnoreCase(actual.trim());
    }

    private String firstNonBlank(String first, String second) {
        if (!isBlank(first)) {
            return first.trim();
        }
        if (!isBlank(second)) {
            return second.trim();
        }
        return null;
    }

    private boolean isBlank(String value) {
        return value == null || value.trim().isBlank();
    }

    private double computeCurrentBalance(Long userId) {
        AgentCashSession session = cashSessionRepository
                .findFirstByAgent_IdAndSessionDateOrderByOpenedAtDesc(userId, LocalDate.now())
                .orElse(null);
        if (session == null) {
            return 0d;
        }
        BigDecimal opening = session.getOpeningBalance() != null ? session.getOpeningBalance() : BigDecimal.ZERO;
        BigDecimal entries = BigDecimal.ZERO;
        BigDecimal exits = BigDecimal.ZERO;
        List<CashMovement> movements = cashMovementRepository.findByCashSession_IdOrderByCreatedAtDesc(session.getId());
        for (CashMovement movement : movements) {
            BigDecimal amountMad = resolveMovementAmountMad(movement);
            if ("IN".equalsIgnoreCase(movement.getMovementType())) {
                entries = entries.add(amountMad);
            } else if ("OUT".equalsIgnoreCase(movement.getMovementType())) {
                exits = exits.add(amountMad);
            }
        }
        return opening.add(entries).subtract(exits).doubleValue();
    }

    private BigDecimal resolveMovementAmountMad(CashMovement movement) {
        if (movement.getAmountMad() != null) {
            return movement.getAmountMad();
        }
        Transfer transfer = movement.getTransfer() != null
                ? movement.getTransfer()
                : movement.getPayout() != null ? movement.getPayout().getTransfer() : null;
        if (transfer != null) {
            String type = movement.getMovementType();
            return buildTransferCashAmounts(transfer, type).amountMad();
        }
        return movement.getAmount() != null ? movement.getAmount() : BigDecimal.ZERO;
    }

    private String buildUniqueEmail(String phone, String firstName, String lastName) {
        String base = normalizeValue(phone);
        if (base.isBlank()) {
            base = normalizeValue(firstName + "." + lastName);
        }
        if (base.isBlank()) {
            base = "client";
        }
        String prefix = "client." + base;
        String candidate = prefix + "@okane.local";
        int index = 1;
        while (userRepository.existsByEmailIgnoreCase(candidate)) {
            candidate = prefix + "-" + index + "@okane.local";
            index += 1;
        }
        return candidate;
    }

    private String transferFullName(String firstName, String lastName, Customer fallbackCustomer) {
        String first = cleanValue(firstName);
        String last = cleanValue(lastName);
        String snapshotName = ((first != null ? first : "") + " " + (last != null ? last : "")).trim();
        if (!snapshotName.isBlank()) {
            return snapshotName;
        }
        return formatFullName(fallbackCustomer != null ? fallbackCustomer.getUser() : null);
    }

    private String cleanValue(String value) {
        return value == null ? null : value.trim();
    }

    private String normalizeValue(String value) {
        if (value == null) {
            return "";
        }
        return value.trim()
                .toLowerCase(Locale.ROOT)
                .replaceAll("[^a-z0-9]+", "")
                .replaceAll("^_+|_+$", "");
    }

    private String formatFullName(User user) {
        if (user == null) {
            return null;
        }
        return (user.getFirstName() + " " + user.getLastName()).trim();
    }

    private String transferCurrencyCode(Transfer transfer) {
        return transfer.getCurrency() != null ? transfer.getCurrency().getCode() : DEFAULT_CURRENCY;
    }

    private record CashMovementAmounts(
            BigDecimal amountOriginal,
            String currencyOriginal,
            BigDecimal exchangeRateToMad,
            BigDecimal amountMad
    ) {
    }

    private static class AgentContext {
        private final User user;
        private final com.okane.agency.entity.Agency agency;
        private final Long agencyId;
        private final Long userId;

        private AgentContext(User user, com.okane.agency.entity.Agency agency, Long agencyId, Long userId) {
            this.user = user;
            this.agency = agency;
            this.agencyId = agencyId;
            this.userId = userId;
        }
    }
}
