package com.okane.cash.service;

import com.okane.agency.entity.AgencyUser;
import com.okane.agency.repository.AgencyUserRepository;
import com.okane.auth.entity.User;
import com.okane.auth.exception.ApiException;
import com.okane.auth.repository.UserRepository;
import com.okane.auth.security.OkaneUserPrincipal;
import com.okane.cash.dto.CashMovementResponse;
import com.okane.cash.dto.CashSessionResponse;
import com.okane.cash.dto.CloseCashSessionRequest;
import com.okane.cash.dto.OpenCashSessionRequest;
import com.okane.cash.entity.AgentCashSession;
import com.okane.cash.entity.CashClosure;
import com.okane.cash.entity.CashMovement;
import com.okane.cash.entity.FundDiscrepancy;
import com.okane.cash.repository.AgentCashSessionRepository;
import com.okane.cash.repository.CashClosureRepository;
import com.okane.cash.repository.CashMovementRepository;
import com.okane.cash.repository.FundDiscrepancyRepository;
import com.okane.currencyfx.entity.Currency;
import com.okane.currencyfx.repository.CurrencyRepository;
import com.okane.currencyfx.repository.ExchangeRateRepository;
import com.okane.notification.service.AgentNotificationService;
import com.okane.transfer.entity.Transfer;
import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;
import org.springframework.http.HttpStatus;
import org.springframework.security.core.Authentication;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class AgentCashService {

    private static final String DEFAULT_CURRENCY = "MAD";

    private final AgentCashSessionRepository sessionRepository;
    private final CashMovementRepository movementRepository;
    private final CashClosureRepository closureRepository;
    private final FundDiscrepancyRepository discrepancyRepository;
    private final UserRepository userRepository;
    private final AgencyUserRepository agencyUserRepository;
    private final CurrencyRepository currencyRepository;
    private final ExchangeRateRepository exchangeRateRepository;
    private final AgentNotificationService agentNotificationService;

    public AgentCashService(
            AgentCashSessionRepository sessionRepository,
            CashMovementRepository movementRepository,
            CashClosureRepository closureRepository,
            FundDiscrepancyRepository discrepancyRepository,
            UserRepository userRepository,
            AgencyUserRepository agencyUserRepository,
            CurrencyRepository currencyRepository,
            ExchangeRateRepository exchangeRateRepository,
            AgentNotificationService agentNotificationService
    ) {
        this.sessionRepository = sessionRepository;
        this.movementRepository = movementRepository;
        this.closureRepository = closureRepository;
        this.discrepancyRepository = discrepancyRepository;
        this.userRepository = userRepository;
        this.agencyUserRepository = agencyUserRepository;
        this.currencyRepository = currencyRepository;
        this.exchangeRateRepository = exchangeRateRepository;
        this.agentNotificationService = agentNotificationService;
    }

    @Transactional(readOnly = true)
    public CashSessionResponse getCurrentSession(Authentication authentication) {
        User user = resolveUser(authentication);
        AgentCashSession session = sessionRepository
                .findFirstByAgent_IdAndSessionDateOrderByOpenedAtDesc(user.getId(), LocalDate.now())
                .orElse(null);
        if (session == null) {
            return emptySession();
        }
        return buildSessionResponse(session);
    }

    @Transactional(readOnly = true)
    public List<CashMovementResponse> getMovements(Authentication authentication) {
        User user = resolveUser(authentication);
        AgentCashSession session = sessionRepository
                .findFirstByAgent_IdAndSessionDateOrderByOpenedAtDesc(user.getId(), LocalDate.now())
                .orElse(null);
        if (session == null) {
            return List.of();
        }
        return movementRepository.findByCashSession_IdOrderByCreatedAtDesc(session.getId())
                .stream()
                .map(this::toMovementResponse)
                .toList();
    }

    @Transactional
    public CashSessionResponse openSession(Authentication authentication, OpenCashSessionRequest request) {
        User user = resolveUser(authentication);
        AgencyUser agencyUser = resolveAgencyUser(user);

        LocalDate today = LocalDate.now();
        AgentCashSession latestSession = sessionRepository
                .findFirstByAgent_IdAndSessionDateOrderByOpenedAtDesc(user.getId(), today)
                .orElse(null);

        if (latestSession != null && "OPEN".equalsIgnoreCase(latestSession.getStatus())) {
            throw new ApiException(HttpStatus.CONFLICT, "Session de caisse dÃ©jÃ  ouverte pour aujourd'hui.");
        }

        if (latestSession != null) {
            reopenExistingSession(latestSession, agencyUser);
            agentNotificationService.notifyCashSessionOpened(user, latestSession.getOpeningBalance());
            return buildSessionResponse(latestSession);
        }

        AgentCashSession session = new AgentCashSession();
        session.setAgent(user);
        session.setAgency(agencyUser.getAgency());
        session.setSessionDate(today);
        session.setOpeningBalance(BigDecimal.valueOf(request.soldeOuverture()));
        session.setStatus("OPEN");
        session.setOpenedAt(LocalDateTime.now());
        sessionRepository.save(session);
        agentNotificationService.notifyCashSessionOpened(user, session.getOpeningBalance());

        return buildSessionResponse(session);
    }

    @Transactional
    public CashSessionResponse closeSession(Authentication authentication, CloseCashSessionRequest request) {
        User user = resolveUser(authentication);
        AgentCashSession session = sessionRepository
                .findFirstByAgent_IdAndSessionDateAndStatusIgnoreCaseOrderByOpenedAtDesc(
                        user.getId(),
                        LocalDate.now(),
                        "OPEN"
                )
                .orElseThrow(() -> new ApiException(HttpStatus.BAD_REQUEST, "Aucune session ouverte."));

        if (!"OPEN".equalsIgnoreCase(session.getStatus())) {
            throw new ApiException(HttpStatus.BAD_REQUEST, "La session est dÃ©jÃ  fermÃ©e.");
        }

        BalanceTotals totals = computeTotals(session);
        BigDecimal expected = totals.expectedBalance;
        BigDecimal actual = BigDecimal.valueOf(request.montantReel());
        BigDecimal diff = actual.subtract(expected);

        String note = request.commentaire() != null ? request.commentaire().trim() : "";
        if (diff.compareTo(BigDecimal.ZERO) != 0 && note.isBlank()) {
            throw new ApiException(HttpStatus.BAD_REQUEST, "Le commentaire est obligatoire si l'Ã©cart n'est pas nul.");
        }

        CashClosure closure = new CashClosure();
        closure.setCashSession(session);
        closure.setClosedBy(user);
        closure.setExpectedBalance(expected);
        closure.setActualBalance(actual);
        closure.setDifferenceAmount(diff);
        closure.setClosedAt(LocalDateTime.now());
        closure.setNote(note.isBlank() ? null : note);
        closureRepository.save(closure);

        if (diff.compareTo(BigDecimal.ZERO) != 0) {
            FundDiscrepancy discrepancy = new FundDiscrepancy();
            discrepancy.setCashClosure(closure);
            discrepancy.setCashSession(session);
            discrepancy.setReportedBy(user);
            discrepancy.setExpectedBalance(expected);
            discrepancy.setActualBalance(actual);
            discrepancy.setDifferenceAmount(diff);
            discrepancy.setDiscrepancyType(diff.compareTo(BigDecimal.ZERO) > 0 ? "SURPLUS" : "DEFICIT");
            discrepancy.setStatus("OPEN");
            discrepancy.setDescription(note.isBlank() ? null : note);
            discrepancy.setReportedAt(LocalDateTime.now());
            discrepancyRepository.save(discrepancy);
            agentNotificationService.notifyCashDiscrepancy(user, diff);
        }

        session.setStatus("CLOSED");
        session.setClosedAt(LocalDateTime.now());
        sessionRepository.save(session);
        agentNotificationService.notifyCashSessionClosed(user, expected, actual);

        return buildSessionResponse(session);
    }

    private void reopenExistingSession(
            AgentCashSession session,
            AgencyUser agencyUser
    ) {
        discrepancyRepository.findByCashSession_Id(session.getId()).ifPresent(discrepancyRepository::delete);
        closureRepository.findByCashSession_Id(session.getId()).ifPresent(closureRepository::delete);

        session.setAgency(agencyUser.getAgency());
        session.setStatus("OPEN");
        session.setOpenedAt(LocalDateTime.now());
        session.setClosedAt(null);
        sessionRepository.save(session);
    }

    private CashSessionResponse buildSessionResponse(AgentCashSession session) {
        BalanceTotals totals = computeTotals(session);
        CashClosure closure = closureRepository.findByCashSession_Id(session.getId()).orElse(null);

        Double actualBalance = closure != null ? closure.getActualBalance().doubleValue() : null;
        double difference = closure != null ? closure.getDifferenceAmount().doubleValue() : 0d;
        String closedAt = closure != null && closure.getClosedAt() != null ? closure.getClosedAt().toString() : null;
        String note = closure != null ? closure.getNote() : null;

        return new CashSessionResponse(
                session.getId() != null ? session.getId().toString() : null,
                totals.openingBalance.doubleValue(),
                totals.currentBalance.doubleValue(),
                totals.totalEntries.doubleValue(),
                totals.totalExits.doubleValue(),
                totals.expectedBalance.doubleValue(),
                actualBalance,
                difference,
                session.getStatus(),
                session.getOpenedAt() != null ? session.getOpenedAt().toString() : null,
                closedAt,
                DEFAULT_CURRENCY,
                note
        );
    }

    private CashMovementResponse toMovementResponse(CashMovement movement) {
        String reference = resolveReference(movement);
        String description = movement.getDescription();
        if (description == null || description.isBlank()) {
            description = reference != null ? "RÃ©fÃ©rence " + reference : "Mouvement de caisse";
        }
        return new CashMovementResponse(
                movement.getId() != null ? movement.getId().toString() : null,
                reference,
                movement.getMovementType(),
                resolveMovementAmountMad(movement).doubleValue(),
                resolveMovementAmountMad(movement).doubleValue(),
                resolveMovementAmountOriginal(movement).doubleValue(),
                resolveMovementCurrencyOriginal(movement),
                resolveMovementExchangeRateToMad(movement).doubleValue(),
                movement.getCreatedAt() != null ? movement.getCreatedAt().toString() : null,
                description
        );
    }

    private String resolveReference(CashMovement movement) {
        if (movement.getTransfer() != null) {
            return movement.getTransfer().getReferenceCode();
        }
        if (movement.getPayout() != null) {
            Transfer transfer = movement.getPayout().getTransfer();
            if (transfer != null) {
                return transfer.getReferenceCode();
            }
        }
        return null;
    }

    private BalanceTotals computeTotals(AgentCashSession session) {
        List<CashMovement> movements = movementRepository.findByCashSession_IdOrderByCreatedAtDesc(session.getId());
        BigDecimal totalEntries = BigDecimal.ZERO;
        BigDecimal totalExits = BigDecimal.ZERO;

        for (CashMovement movement : movements) {
            BigDecimal amountMad = resolveMovementAmountMad(movement);
            if ("IN".equalsIgnoreCase(movement.getMovementType())) {
                totalEntries = totalEntries.add(amountMad);
            } else if ("OUT".equalsIgnoreCase(movement.getMovementType())) {
                totalExits = totalExits.add(amountMad);
            }
        }

        BigDecimal opening = session.getOpeningBalance() != null ? session.getOpeningBalance() : BigDecimal.ZERO;
        BigDecimal expected = opening.add(totalEntries).subtract(totalExits);
        return new BalanceTotals(opening, expected, expected, totalEntries, totalExits);
    }

    private CashSessionResponse emptySession() {
        return new CashSessionResponse(
                null,
                0d,
                0d,
                0d,
                0d,
                0d,
                null,
                0d,
                "CLOSED",
                null,
                null,
                DEFAULT_CURRENCY,
                null
        );
    }

    private BigDecimal resolveMovementAmountMad(CashMovement movement) {
        Transfer transfer = resolveMovementTransfer(movement);
        if (transfer != null) {
            return resolveTransferAmountMad(transfer, movement.getMovementType());
        }
        if (movement.getAmountMad() != null) {
            return movement.getAmountMad();
        }
        BigDecimal original = resolveMovementAmountOriginal(movement);
        BigDecimal rate = resolveMovementExchangeRateToMad(movement);
        if (original == null || rate == null) {
            return movement.getAmount() != null ? movement.getAmount() : BigDecimal.ZERO;
        }
        return original.multiply(rate).setScale(2, RoundingMode.HALF_UP);
    }

    private BigDecimal resolveMovementAmountOriginal(CashMovement movement) {
        Transfer transfer = resolveMovementTransfer(movement);
        if (transfer != null) {
            BigDecimal amount = transfer.getAmount() != null ? transfer.getAmount() : BigDecimal.ZERO;
            if ("IN".equalsIgnoreCase(movement.getMovementType()) && transfer.getFeeAmount() != null) {
                amount = amount.add(transfer.getFeeAmount());
            }
            return amount;
        }
        if (movement.getAmountOriginal() != null) {
            return movement.getAmountOriginal();
        }
        return movement.getAmount() != null ? movement.getAmount() : BigDecimal.ZERO;
    }

    private String resolveMovementCurrencyOriginal(CashMovement movement) {
        Transfer transfer = resolveMovementTransfer(movement);
        if (transfer != null) {
            return transferCurrencyCode(transfer);
        }
        if (movement.getCurrencyOriginal() != null && !movement.getCurrencyOriginal().isBlank()) {
            return movement.getCurrencyOriginal();
        }
        return DEFAULT_CURRENCY;
    }

    private BigDecimal resolveMovementExchangeRateToMad(CashMovement movement) {
        Transfer transfer = resolveMovementTransfer(movement);
        if (transfer != null) {
            BigDecimal rate = deriveExchangeRateToMad(transferCurrencyCode(transfer), transfer);
            return rate != null ? rate : BigDecimal.ONE;
        }
        if (movement.getExchangeRateToMad() != null) {
            return movement.getExchangeRateToMad();
        }
        BigDecimal rate = deriveExchangeRateToMad(resolveMovementCurrencyOriginal(movement), null);
        return rate != null ? rate : BigDecimal.ONE;
    }

    private Transfer resolveMovementTransfer(CashMovement movement) {
        if (movement.getTransfer() != null) {
            return movement.getTransfer();
        }
        return movement.getPayout() != null ? movement.getPayout().getTransfer() : null;
    }

    private BigDecimal deriveExchangeRateToMad(String currencyCode, Transfer transfer) {
        if (currencyCode == null || DEFAULT_CURRENCY.equalsIgnoreCase(currencyCode)) {
            return BigDecimal.ONE;
        }
        if (transfer == null || transfer.getExchangeRate() == null || transfer.getExchangeRate().compareTo(BigDecimal.ZERO) <= 0) {
            return null;
        }
        String sourceCurrency = transferCurrencyCode(transfer);
        String destinationCurrency = transfer.getDestinationCurrency() != null
                ? transfer.getDestinationCurrency().getCode()
                : sourceCurrency;

        if (currencyCode.equalsIgnoreCase(sourceCurrency)
                && DEFAULT_CURRENCY.equalsIgnoreCase(destinationCurrency)) {
            return transfer.getExchangeRate();
        }
        if (currencyCode.equalsIgnoreCase(destinationCurrency)
                && DEFAULT_CURRENCY.equalsIgnoreCase(sourceCurrency)) {
            return BigDecimal.ONE.divide(transfer.getExchangeRate(), 8, RoundingMode.HALF_UP);
        }
        return lookupExchangeRateToMad(currencyCode).orElse(null);
    }

    private BigDecimal resolveTransferAmountMad(Transfer transfer, String movementType) {
        BigDecimal originalAmount = transfer.getAmount() != null ? transfer.getAmount() : BigDecimal.ZERO;
        if ("IN".equalsIgnoreCase(movementType) && transfer.getFeeAmount() != null) {
            originalAmount = originalAmount.add(transfer.getFeeAmount());
        }
        BigDecimal rate = deriveExchangeRateToMad(transferCurrencyCode(transfer), transfer);
        if (rate == null) {
            return originalAmount;
        }
        return originalAmount.multiply(rate).setScale(2, RoundingMode.HALF_UP);
    }

    private String transferCurrencyCode(Transfer transfer) {
        return transfer.getCurrency() != null ? transfer.getCurrency().getCode() : DEFAULT_CURRENCY;
    }

    private Optional<BigDecimal> lookupExchangeRateToMad(String currencyCode) {
        Optional<Currency> original = currencyRepository.findByCode(currencyCode);
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

    private AgencyUser resolveAgencyUser(User user) {
        return agencyUserRepository.findFirstByUser_IdAndActiveTrue(user.getId())
                .orElseThrow(() -> new ApiException(HttpStatus.BAD_REQUEST, "Agent non affectÃ© Ã  une agence."));
    }

    private static class BalanceTotals {
        private final BigDecimal openingBalance;
        private final BigDecimal expectedBalance;
        private final BigDecimal currentBalance;
        private final BigDecimal totalEntries;
        private final BigDecimal totalExits;

        private BalanceTotals(
                BigDecimal openingBalance,
                BigDecimal expectedBalance,
                BigDecimal currentBalance,
                BigDecimal totalEntries,
                BigDecimal totalExits
        ) {
            this.openingBalance = openingBalance;
            this.expectedBalance = expectedBalance;
            this.currentBalance = currentBalance;
            this.totalEntries = totalEntries;
            this.totalExits = totalExits;
        }
    }
}
