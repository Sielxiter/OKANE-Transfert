package com.okane.transfermanagement.service;

import com.okane.agency.entity.Agency;
import com.okane.centralagency.entity.CentralAgency;
import com.okane.agency.repository.AgencyRepository;
import com.okane.auth.entity.Role;
import com.okane.auth.entity.User;
import com.okane.auth.exception.ApiException;
import com.okane.auth.repository.RoleRepository;
import com.okane.auth.repository.UserRepository;
import com.okane.auth.security.OkaneUserPrincipal;
import com.okane.cash.entity.AgentCashSession;
import com.okane.cash.repository.AgentCashSessionRepository;
import com.okane.currencyfx.entity.Country;
import com.okane.currencyfx.entity.Currency;
import com.okane.currencyfx.entity.ExchangeRate;
import com.okane.currencyfx.entity.TransferCorridor;
import com.okane.currencyfx.repository.CountryRepository;
import com.okane.currencyfx.repository.CurrencyRepository;
import com.okane.currencyfx.repository.ExchangeRateRepository;
import com.okane.currencyfx.repository.TransferCorridorRepository;
import com.okane.customer.entity.Customer;
import com.okane.customer.repository.CustomerRepository;
import com.okane.feescommission.entity.TariffLine;
import com.okane.feescommission.repository.TariffLineRepository;
import com.okane.feemanagement.domain.TariffValueType;
import com.okane.transfer.entity.Transfer;
import com.okane.transfer.entity.TransferBeneficiary;
import com.okane.transfer.repository.TransferBeneficiaryRepository;
import com.okane.transfer.repository.TransferRepository;
import com.okane.transfermanagement.domain.TransferStatus;
import com.okane.transfermanagement.dto.AgentCountryResponseDTO;
import com.okane.transfermanagement.dto.AgentCurrencyResponseDTO;
import com.okane.transfermanagement.dto.AgentTransferListItemDTO;
import com.okane.transfermanagement.dto.AgentTransferLookupDTO;
import com.okane.transfermanagement.dto.AgentTransferQuoteRequestDTO;
import com.okane.transfermanagement.dto.AgentTransferQuoteResponseDTO;
import com.okane.transfermanagement.dto.AgentTransferResponseDTO;
import com.okane.transfermanagement.dto.CreateAgentTransferRequestDTO;
import jakarta.persistence.EntityNotFoundException;
import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;
import java.util.Comparator;
import java.util.List;
import java.util.Locale;
import java.util.UUID;
import org.springframework.data.domain.Sort;
import org.springframework.http.HttpStatus;
import org.springframework.security.core.Authentication;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class AgentTransferService {

    private static final BigDecimal HUNDRED = new BigDecimal("100");
    private static final int SCALE = 2;
    private static final int RATE_SCALE = 6;

    private final CountryRepository countryRepository;
    private final CurrencyRepository currencyRepository;
    private final ExchangeRateRepository exchangeRateRepository;
    private final TransferCorridorRepository transferCorridorRepository;
    private final TariffLineRepository tariffLineRepository;
    private final CustomerRepository customerRepository;
    private final UserRepository userRepository;
    private final RoleRepository roleRepository;
    private final TransferRepository transferRepository;
    private final TransferBeneficiaryRepository transferBeneficiaryRepository;
    private final AgentCashSessionRepository agentCashSessionRepository;
    private final TransferAuditService auditService;
    private final TransferNotificationService notificationService;
    private final AgencyRepository agencyRepository;
    private final com.okane.agencybalance.service.AgencyBalanceService agencyBalanceService;
    private final PasswordEncoder passwordEncoder;

    public AgentTransferService(
            CountryRepository countryRepository,
            CurrencyRepository currencyRepository,
            ExchangeRateRepository exchangeRateRepository,
            TransferCorridorRepository transferCorridorRepository,
            TariffLineRepository tariffLineRepository,
            CustomerRepository customerRepository,
            UserRepository userRepository,
            RoleRepository roleRepository,
            TransferRepository transferRepository,
            TransferBeneficiaryRepository transferBeneficiaryRepository,
            AgentCashSessionRepository agentCashSessionRepository,
            TransferAuditService auditService,
            TransferNotificationService notificationService,
            AgencyRepository agencyRepository,
            com.okane.agencybalance.service.AgencyBalanceService agencyBalanceService,
            PasswordEncoder passwordEncoder
    ) {
        this.countryRepository = countryRepository;
        this.currencyRepository = currencyRepository;
        this.exchangeRateRepository = exchangeRateRepository;
        this.transferCorridorRepository = transferCorridorRepository;
        this.tariffLineRepository = tariffLineRepository;
        this.customerRepository = customerRepository;
        this.userRepository = userRepository;
        this.roleRepository = roleRepository;
        this.transferRepository = transferRepository;
        this.transferBeneficiaryRepository = transferBeneficiaryRepository;
        this.agentCashSessionRepository = agentCashSessionRepository;
        this.auditService = auditService;
        this.notificationService = notificationService;
        this.agencyRepository = agencyRepository;
        this.agencyBalanceService = agencyBalanceService;
        this.passwordEncoder = passwordEncoder;
    }

    @Transactional(readOnly = true)
    public List<AgentCountryResponseDTO> findCountries() {
        return countryRepository.findAll(Sort.by(Sort.Direction.ASC, "name")).stream()
                .map(country -> new AgentCountryResponseDTO(
                        country.getId(),
                        country.getCode(),
                        country.getName(),
                        country.getCurrency() != null ? country.getCurrency().getSymbol() : null,
                        country.getPhoneCode()
                ))
                .toList();
    }

    @Transactional(readOnly = true)
    public List<AgentCurrencyResponseDTO> findCurrencies() {
        return currencyRepository.findAllByOrderByNameAsc().stream()
                .filter(currency -> Boolean.TRUE.equals(currency.getActive()))
                .map(currency -> new AgentCurrencyResponseDTO(
                        currency.getId(),
                        currency.getName(),
                        currency.getSymbol(),
                        currency.getActive()
                ))
                .toList();
    }

    @Transactional(readOnly = true)
    public AgentTransferQuoteResponseDTO quote(AgentTransferQuoteRequestDTO request) {
        QuoteComputation quote = buildQuote(request);
        return new AgentTransferQuoteResponseDTO(
                quote.amount(),
                quote.baseTransferFee(),
                quote.corridorPercent(),
                quote.corridorFee(),
                quote.finalTransferFee(),
                quote.agencyCommission(),
                quote.centralCommission(),
                quote.exchangeRate(),
                quote.matchedLineId(),
                quote.corridorId()
        );
    }

    @Transactional
    public AgentTransferResponseDTO createTransfer(CreateAgentTransferRequestDTO request, Authentication authentication) {
        QuoteComputation quote = buildQuote(new AgentTransferQuoteRequestDTO(
                request.amount(),
                request.senderCountryCode(),
                request.beneficiaryCountryCode(),
                request.sourceCurrencyCode(),
                request.destinationCurrencyCode()
        ));
        if (request.amount().compareTo(quote.finalTransferFee()) < 0) {
            throw new ApiException(HttpStatus.BAD_REQUEST,
                    "Les frais calculés dépassent le montant du transfert.");
        }

        User agent = currentUser(authentication);
        AgentCashSession cashSession = resolveActiveCashSession(agent);
        Agency sourceAgency = cashSession.getAgency();
        Currency currency = resolveCurrency(request.sourceCurrencyCode());
        BigDecimal exchangeRate = quote.exchangeRate();

        Customer sender = customerRepository.findById(request.senderClientId())
                .orElseThrow(() -> new ApiException(HttpStatus.BAD_REQUEST, "Expediteur introuvable."));
        TransferBeneficiary beneficiarySnapshot = createBeneficiarySnapshot(request);
        Customer beneficiary = ensureBeneficiaryCustomer(request, beneficiarySnapshot);

        BigDecimal netAmount = scaleMoney(request.amount().subtract(quote.finalTransferFee()).multiply(exchangeRate));

        Transfer transfer = new Transfer();
        transfer.setReferenceCode(generateReference());
        transfer.setWithdrawalCode(generateWithdrawalCode());
        transfer.setSender(sender);
        transfer.setBeneficiary(beneficiary);
        transfer.setBeneficiarySnapshot(beneficiarySnapshot);
        transfer.setSourceAgency(sourceAgency);
        transfer.setCreatedBy(agent);
        transfer.setCashSession(cashSession);
        transfer.setCurrency(currency);
        transfer.setAmount(scaleMoney(request.amount()));
        transfer.setFeeAmount(quote.finalTransferFee());
        transfer.setBaseFeeAmount(quote.baseTransferFee());
        transfer.setCorridorFeeAmount(quote.corridorFee());
        transfer.setCorridorPercent(quote.corridorPercent());
        transfer.setAgencyCommissionAmount(quote.agencyCommission());
        transfer.setCentralCommissionAmount(quote.centralCommission());
        transfer.setExchangeRate(exchangeRate);
        transfer.setNetAmount(netAmount);
        transfer.setStatus(TransferStatus.EN_ATTENTE.name());
        LocalDateTime now = LocalDateTime.now();
        transfer.setSentAt(now);
        transfer.setCreatedAt(now);
        transfer.setUpdatedAt(now);

        Transfer saved = transferRepository.save(transfer);
        auditService.logTransferCreated(agent, saved);
        notificationService.notifyTransferCreated(saved, beneficiarySnapshot, sender.getUser() != null ? sender.getUser().getEmail() : null);

        // Record cash movements for balance tracking
        recordCashMovements(saved, agent, cashSession);

        return new AgentTransferResponseDTO(
                saved.getId(),
                saved.getReferenceCode(),
                saved.getWithdrawalCode(),
                saved.getStatus(),
                saved.getAmount(),
                saved.getFeeAmount(),
                saved.getAgencyCommissionAmount(),
                saved.getCentralCommissionAmount(),
                saved.getNetAmount(),
                fullName(sender.getUser()),
                fullName(beneficiary.getUser()),
                saved.getCreatedAt()
        );
    }

    private QuoteComputation buildQuote(AgentTransferQuoteRequestDTO request) {
        if (request.amount() == null || request.amount().signum() <= 0) {
            throw new ApiException(HttpStatus.BAD_REQUEST, "Le montant doit etre strictement positif.");
        }
        Country senderCountry = resolveCountry(request.senderCountryCode());
        Country beneficiaryCountry = resolveCountry(request.beneficiaryCountryCode());
        Currency sourceCurrency = resolveCurrency(request.sourceCurrencyCode());
        Currency destinationCurrency = resolveCurrency(request.destinationCurrencyCode());
        TariffLine tariffLine = resolveTariffLine(request.amount());

        BigDecimal amount = scaleMoney(request.amount());
        BigDecimal baseTransferFee = computeFee(tariffLine.getTransferFeeType(), tariffLine.getTransferFeeValue(), amount);
        BigDecimal corridorPercent = BigDecimal.ZERO;
        BigDecimal corridorFee = BigDecimal.ZERO;
        Long corridorId = null;

        if (senderCountry != null && beneficiaryCountry != null
                && !sameCountry(senderCountry.getCode(), beneficiaryCountry.getCode())) {
            TransferCorridor corridor = transferCorridorRepository
                    .findBySourceCountry_IdAndDestinationCountry_Id(senderCountry.getId(), beneficiaryCountry.getId())
                    .orElse(null);
            if (corridor != null && Boolean.TRUE.equals(corridor.getActive()) && corridor.getEstimatedFees() != null) {
                corridorPercent = scalePct(corridor.getEstimatedFees());
                corridorFee = scaleMoney(amount.multiply(corridorPercent).divide(HUNDRED, SCALE, RoundingMode.HALF_UP));
                corridorId = corridor.getId();
            }
        }

        BigDecimal finalTransferFee = scaleMoney(baseTransferFee.add(corridorFee));
        BigDecimal agencyCommission = computeFee(
                tariffLine.getAgencyCommissionType(),
                tariffLine.getAgencyCommissionValue(),
                finalTransferFee
        );
        BigDecimal centralCommission = computeFee(
                tariffLine.getCentralCommissionType(),
                tariffLine.getCentralCommissionValue(),
                finalTransferFee
        );

        if (agencyCommission.add(centralCommission).compareTo(finalTransferFee) != 0) {
            throw new ApiException(HttpStatus.BAD_REQUEST,
                    "La grille tarifaire est incoherente : commission agence + commission centrale doit etre egale au frais final.");
        }

        BigDecimal exchangeRate = resolveExchangeRate(sourceCurrency, destinationCurrency);

        return new QuoteComputation(
                amount,
                baseTransferFee,
                corridorPercent,
                corridorFee,
                finalTransferFee,
                agencyCommission,
                centralCommission,
                exchangeRate,
                tariffLine.getId(),
                corridorId
        );
    }

    private TariffLine resolveTariffLine(BigDecimal amount) {
        BigDecimal normalizedAmount = scaleMoney(amount);
        return tariffLineRepository.findAll().stream()
                .filter(line -> normalizedAmount.compareTo(line.getMinAmount()) >= 0
                        && normalizedAmount.compareTo(line.getMaxAmount()) <= 0)
                .sorted(Comparator.comparing(TariffLine::getMinAmount).thenComparing(TariffLine::getMaxAmount))
                .findFirst()
                .orElseThrow(() -> new ApiException(HttpStatus.BAD_REQUEST,
                        "Aucune grille tarifaire ne correspond a ce montant."));
    }

    private Country resolveCountry(String code) {
        if (code == null || code.isBlank()) {
            throw new ApiException(HttpStatus.BAD_REQUEST, "Le pays est obligatoire.");
        }
        return countryRepository.findByCode(code.trim().toUpperCase(Locale.ROOT))
                .orElseThrow(() -> new ApiException(HttpStatus.BAD_REQUEST, "Pays introuvable : " + code));
    }

    private Currency resolveCurrency(String symbol) {
        if (symbol == null || symbol.isBlank()) {
            throw new ApiException(HttpStatus.BAD_REQUEST, "La devise est obligatoire.");
        }
        return currencyRepository.findBySymbolIgnoreCase(symbol.trim())
                .orElseThrow(() -> new ApiException(HttpStatus.BAD_REQUEST, "Devise introuvable : " + symbol));
    }

    private BigDecimal resolveExchangeRate(Currency sourceCurrency, Currency destinationCurrency) {
        if (sourceCurrency == null || destinationCurrency == null) {
            throw new ApiException(HttpStatus.BAD_REQUEST, "Les devises source et destination sont obligatoires.");
        }
        String sourceSymbol = sourceCurrency.getSymbol() == null ? "" : sourceCurrency.getSymbol().trim();
        String destinationSymbol = destinationCurrency.getSymbol() == null ? "" : destinationCurrency.getSymbol().trim();
        if (!sourceSymbol.isBlank() && sourceSymbol.equalsIgnoreCase(destinationSymbol)) {
            return BigDecimal.ONE.setScale(RATE_SCALE, RoundingMode.HALF_UP);
        }

        Currency mad = currencyRepository.findBySymbolIgnoreCase("MAD")
                .orElseThrow(() -> new ApiException(HttpStatus.BAD_REQUEST, "La devise MAD est introuvable."));
        BigDecimal sourceToMad = resolveRateToMad(sourceCurrency, mad);
        BigDecimal destinationToMad = resolveRateToMad(destinationCurrency, mad);
        if (destinationToMad.compareTo(BigDecimal.ZERO) <= 0) {
            throw new ApiException(HttpStatus.BAD_REQUEST,
                    "Le taux de conversion vers MAD est indisponible pour la devise destination.");
        }
        return sourceToMad.divide(destinationToMad, RATE_SCALE, RoundingMode.HALF_UP);
    }

    private BigDecimal resolveRateToMad(Currency currency, Currency mad) {
        if (currency.getId().equals(mad.getId())) {
            return BigDecimal.ONE.setScale(RATE_SCALE, RoundingMode.HALF_UP);
        }
        return exchangeRateRepository
                .findFirstByFromCurrency_IdAndToCurrency_IdOrderByEffectiveAtDescIdDesc(currency.getId(), mad.getId())
                .map(ExchangeRate::getRate)
                .map(this::scaleRate)
                .orElseThrow(() -> new ApiException(HttpStatus.BAD_REQUEST,
                        "Taux MAD introuvable pour la devise " + currency.getSymbol() + "."));
    }

    private AgentCashSession resolveActiveCashSession(User agent) {
        if (agent == null || agent.getId() == null) {
            throw new ApiException(HttpStatus.UNAUTHORIZED, "Utilisateur agent introuvable.");
        }
        return agentCashSessionRepository
                .findFirstByAgent_IdAndSessionDateAndClosedAtIsNullOrderByOpenedAtDesc(
                        agent.getId(),
                        LocalDate.now()
                )
                .orElseThrow(() -> new ApiException(HttpStatus.BAD_REQUEST,
                        "Aucune session de caisse active pour cet agent."));
    }

    private TransferBeneficiary createBeneficiarySnapshot(CreateAgentTransferRequestDTO request) {
        TransferBeneficiary beneficiary = new TransferBeneficiary();
        beneficiary.setFirstName(normalizeText(request.beneficiaryFirstName()));
        beneficiary.setLastName(normalizeText(request.beneficiaryLastName()));
        beneficiary.setEmail(normalizeText(request.beneficiaryEmail()));
        beneficiary.setPhone(normalizeText(request.beneficiaryPhone()));
        beneficiary.setIdentityType(normalizeText(request.beneficiaryIdentityType()).toUpperCase(Locale.ROOT));
        beneficiary.setIdentityNumber(normalizeText(request.beneficiaryIdentityNumber()).toUpperCase(Locale.ROOT));
        Country country = resolveCountry(request.beneficiaryCountryCode());
        beneficiary.setCountryCode(country.getCode());
        beneficiary.setCountryName(country.getName());
        LocalDateTime now = LocalDateTime.now();
        beneficiary.setCreatedAt(now);
        beneficiary.setUpdatedAt(now);
        return transferBeneficiaryRepository.save(beneficiary);
    }

    private Customer ensureBeneficiaryCustomer(
            CreateAgentTransferRequestDTO request,
            TransferBeneficiary beneficiarySnapshot
    ) {
        String identityType = normalizeText(request.beneficiaryIdentityType()).toUpperCase(Locale.ROOT);
        String identityNumber = normalizeText(request.beneficiaryIdentityNumber()).toUpperCase(Locale.ROOT);
        String firstName = normalizeText(request.beneficiaryFirstName());
        String lastName = normalizeText(request.beneficiaryLastName());
        String beneficiaryEmail = normalizeText(request.beneficiaryEmail()).toLowerCase(Locale.ROOT);
        String phone = normalizeText(request.beneficiaryPhone());
        String countryName = beneficiarySnapshot.getCountryName();
        LocalDateTime now = LocalDateTime.now();

        Customer customer = customerRepository.findByIdentityTypeAndIdentityNumber(identityType, identityNumber)
                .orElseGet(Customer::new);

        boolean isNew = customer.getId() == null;
        if (isNew) {
            User user = new User();
            user.setFirstName(firstName);
            user.setLastName(lastName);
            user.setPhone(phone);
            user.setEmail(beneficiaryEmail);
            user.setPasswordHash(passwordEncoder.encode(UUID.randomUUID().toString()));
            user.setEnabled(true);
            user.setAccountLocked(false);
            user.setAccountSuspended(false);
            user.setFailedLoginAttempts(0);
            user.setCreatedAt(now);
            user.setUpdatedAt(now);
            Role clientRole = roleRepository.findByName("ROLE_CLIENT")
                    .orElseThrow(() -> new ApiException(HttpStatus.INTERNAL_SERVER_ERROR, "ROLE_CLIENT introuvable."));
            user.setRole(clientRole);
            user = userRepository.save(user);

            customer.setUser(user);
            customer.setIdentityType(identityType);
            customer.setIdentityNumber(identityNumber);
            customer.setCreatedAt(now);
        } else if (customer.getUser() != null) {
            User user = customer.getUser();
            user.setFirstName(firstName);
            user.setLastName(lastName);
            user.setPhone(phone);
            user.setUpdatedAt(now);
            userRepository.save(user);
        }

        customer.setCountry(countryName);
        customer.setNationality(countryName);
        customer.setUpdatedAt(now);
        customer.setKycStatus(customer.getKycStatus() == null ? "EN_ATTENTE" : customer.getKycStatus());
        customer.setAmlRiskLevel(customer.getAmlRiskLevel() == null ? "LOW" : customer.getAmlRiskLevel());
        customer.setRestricted(Boolean.FALSE);
        return customerRepository.save(customer);
    }

    private String buildUniqueBeneficiaryEmail(String firstName, String lastName, String identityNumber, String phone) {
        String base = (normalizeEmailPart(firstName) + "." + normalizeEmailPart(lastName)).replaceAll("\\.+", ".");
        if (base.isBlank() || ".".equals(base)) {
            base = "beneficiary";
        }
        String seed = identityNumber.replaceAll("[^A-Z0-9]", "");
        if (seed.isBlank()) {
            seed = phone.replaceAll("[^0-9]", "");
        }
        if (seed.isBlank()) {
            seed = Long.toString(System.currentTimeMillis());
        }
        String email = (base + "." + seed + "@okane.local").toLowerCase(Locale.ROOT);
        while (userRepository.existsByEmailIgnoreCase(email)) {
            email = (base + "." + seed + "." + UUID.randomUUID().toString().substring(0, 8) + "@okane.local")
                    .toLowerCase(Locale.ROOT);
        }
        return email;
    }

    private String normalizeEmailPart(String value) {
        return normalizeText(value)
                .toLowerCase(Locale.ROOT)
                .replaceAll("[^a-z0-9]+", ".");
    }

    private String normalizeText(String value) {
        return value == null ? "" : value.trim();
    }

    private boolean sameCountry(String first, String second) {
        if (first == null || second == null) {
            return false;
        }
        return first.trim().equalsIgnoreCase(second.trim());
    }

    private BigDecimal computeFee(TariffValueType type, BigDecimal value, BigDecimal baseAmount) {
        if (type == null || value == null) {
            return BigDecimal.ZERO;
        }
        if (type == TariffValueType.FIXED) {
            return scaleMoney(value);
        }
        return scaleMoney(baseAmount.multiply(scalePct(value)).divide(HUNDRED, SCALE, RoundingMode.HALF_UP));
    }

    private BigDecimal scaleMoney(BigDecimal value) {
        if (value == null) {
            return BigDecimal.ZERO;
        }
        return value.setScale(SCALE, RoundingMode.HALF_UP);
    }

    private BigDecimal scaleRate(BigDecimal value) {
        if (value == null) {
            return BigDecimal.ZERO;
        }
        return value.setScale(RATE_SCALE, RoundingMode.HALF_UP);
    }

    private BigDecimal scalePct(BigDecimal value) {
        if (value == null) {
            return BigDecimal.ZERO;
        }
        return value.setScale(SCALE, RoundingMode.HALF_UP);
    }

    private User currentUser(Authentication authentication) {
        if (authentication == null || !(authentication.getPrincipal() instanceof OkaneUserPrincipal principal)) {
            throw new ApiException(HttpStatus.UNAUTHORIZED, "Authentification requise.");
        }
        User principalUser = principal.getUser();
        if (principalUser == null || principalUser.getId() == null) {
            throw new ApiException(HttpStatus.UNAUTHORIZED, "Authentification requise.");
        }
        return userRepository.findById(principalUser.getId())
                .orElseThrow(() -> new ApiException(HttpStatus.UNAUTHORIZED, "Utilisateur introuvable."));
    }

    private String generateReference() {
        return "OK-" + UUID.randomUUID().toString().replace("-", "").substring(0, 10).toUpperCase(Locale.ROOT);
    }

    private String generateWithdrawalCode() {
        return UUID.randomUUID().toString().replace("-", "").substring(0, 12).toUpperCase(Locale.ROOT);
    }

    private String fullName(User user) {
        if (user == null) {
            return null;
        }
        String first = user.getFirstName() == null ? "" : user.getFirstName();
        String last = user.getLastName() == null ? "" : user.getLastName();
        String result = (first + " " + last).trim();
        return result.isEmpty() ? user.getEmail() : result;
    }

    @Transactional(readOnly = true)
    public List<AgentTransferListItemDTO> listMyTransfers(Authentication authentication) {
        User agent = currentUser(authentication);
        LocalDateTime start = LocalDate.now().atStartOfDay().minusDays(30);
        LocalDateTime end = LocalDateTime.now();
        List<Transfer> transfers = transferRepository.findByCreatedBy_IdAndCreatedAtBetweenOrderByCreatedAtDesc(agent.getId(), start, end);
        return transfers.stream().map(this::toListItemDTO).toList();
    }

    @Transactional(readOnly = true)
    public AgentTransferLookupDTO lookupByReference(String referenceCode) {
        Transfer transfer = transferRepository.findByReferenceCode(referenceCode.trim().toUpperCase())
                .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "Transfert introuvable."));
        return toLookupDTO(transfer);
    }

    @Transactional(readOnly = true)
    public AgentTransferLookupDTO lookupByWithdrawalCode(String withdrawalCode) {
        Transfer transfer = transferRepository.findByWithdrawalCode(withdrawalCode.trim().toUpperCase())
                .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "Transfert introuvable."));
        return toLookupDTO(transfer);
    }

    @Transactional(readOnly = true)
    public AgentTransferLookupDTO lookupByBeneficiaryPhone(String phone) {
        List<Transfer> transfers = transferRepository.findByBeneficiaryPhone(phone.trim());
        if (transfers.isEmpty()) {
            throw new ApiException(HttpStatus.NOT_FOUND, "Transfert introuvable.");
        }
        return toLookupDTO(transfers.get(0));
    }

    private AgentTransferListItemDTO toListItemDTO(Transfer t) {
        return new AgentTransferListItemDTO(
                t.getId(),
                t.getReferenceCode(),
                t.getWithdrawalCode(),
                fullName(t.getSender() != null ? t.getSender().getUser() : null),
                t.getSender() != null && t.getSender().getUser() != null ? t.getSender().getUser().getPhone() : null,
                t.getBeneficiary() != null ? fullName(t.getBeneficiary().getUser()) : null,
                t.getBeneficiarySnapshot() != null ? t.getBeneficiarySnapshot().getPhone() : null,
                t.getAmount(),
                t.getCurrency() != null ? t.getCurrency().getSymbol() : null,
                t.getFeeAmount(),
                t.getNetAmount(),
                t.getStatus(),
                t.getCreatedAt(),
                t.getSentAt(),
                t.getExpiresAt()
        );
    }

    private AgentTransferLookupDTO toLookupDTO(Transfer t) {
        return new AgentTransferLookupDTO(
                t.getId(),
                t.getReferenceCode(),
                t.getWithdrawalCode(),
                fullName(t.getSender() != null ? t.getSender().getUser() : null),
                t.getSender() != null && t.getSender().getUser() != null ? t.getSender().getUser().getPhone() : null,
                t.getBeneficiary() != null ? fullName(t.getBeneficiary().getUser()) : null,
                t.getBeneficiarySnapshot() != null ? t.getBeneficiarySnapshot().getPhone() : null,
                t.getAmount(),
                t.getCurrency() != null ? t.getCurrency().getSymbol() : null,
                t.getFeeAmount(),
                t.getNetAmount(),
                t.getStatus(),
                t.getCreatedAt(),
                t.getSentAt(),
                t.getExpiresAt(),
                t.getSourceAgency() != null ? t.getSourceAgency().getName() : null,
                t.getSourceAgency() != null ? t.getSourceAgency().getCode() : null
        );
    }

    private void recordCashMovements(Transfer transfer, User agent, AgentCashSession session) {
        Agency sourceAgency = transfer.getSourceAgency();
        if (sourceAgency == null) {
            return;
        }
        BigDecimal totalIn = transfer.getAmount().add(transfer.getFeeAmount());
        agencyBalanceService.recordTransferIn(sourceAgency, agent, transfer.getAmount(), transfer.getFeeAmount(), transfer, session);
        agencyBalanceService.recordCommissionAgency(sourceAgency, agent, transfer.getAgencyCommissionAmount(), transfer, session);

        CentralAgency central = sourceAgency.getCentralAgency();
        if (central != null) {
            Agency centralAgency = agencyRepository.findById(central.getId()).orElse(null);
            if (centralAgency != null) {
                agencyBalanceService.recordCommissionCentral(centralAgency, agent, transfer.getCentralCommissionAmount(), transfer, session);
            }
        }
    }

    private record QuoteComputation(
            BigDecimal amount,
            BigDecimal baseTransferFee,
            BigDecimal corridorPercent,
            BigDecimal corridorFee,
            BigDecimal finalTransferFee,
            BigDecimal agencyCommission,
            BigDecimal centralCommission,
            BigDecimal exchangeRate,
            Long matchedLineId,
            Long corridorId
    ) {
    }
}
