package com.okane.feemanagement.service;

import com.okane.auth.entity.User;
import com.okane.auth.repository.AuditLogRepository;
import com.okane.auth.repository.UserRepository;
import com.okane.auth.security.OkaneUserPrincipal;
import com.okane.currencyfx.entity.Country;
import com.okane.currencyfx.entity.Currency;
import com.okane.currencyfx.entity.TransferCorridor;
import com.okane.currencyfx.repository.CountryRepository;
import com.okane.currencyfx.repository.CurrencyRepository;
import com.okane.currencyfx.repository.TransferCorridorRepository;
import com.okane.feemanagement.domain.FeeGridStatus;
import com.okane.feemanagement.dto.ChangeFeeGridStatusRequestDTO;
import com.okane.feemanagement.dto.CommissionResponseDTO;
import com.okane.feemanagement.dto.CreateFeeGridRequestDTO;
import com.okane.feemanagement.dto.FeeGridResponseDTO;
import com.okane.feemanagement.dto.FeeSimulationRequestDTO;
import com.okane.feemanagement.dto.FeeSimulationResponseDTO;
import com.okane.feemanagement.dto.FeeSummaryDTO;
import com.okane.feemanagement.exception.FeeGridNotFoundException;
import com.okane.feemanagement.exception.InvalidFeeGridException;
import com.okane.feemanagement.exception.NoActiveFeeGridException;
import com.okane.feescommission.entity.CommissionRule;
import com.okane.feescommission.entity.FeeBracket;
import com.okane.feescommission.entity.FeeGrid;
import com.okane.feescommission.repository.CommissionRuleRepository;
import com.okane.feescommission.repository.FeeBracketRepository;
import com.okane.feescommission.repository.FeeGridRepository;
import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;
import java.util.ArrayList;
import java.util.List;
import java.util.Locale;
import java.util.Optional;
import org.springframework.security.core.Authentication;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class AdminFeeService {

    private static final String FEE_TYPE_PERCENT = "POURCENTAGE";
    private static final String FEE_TYPE_FIXED = "FIXE";
    private static final BigDecimal HUNDRED = new BigDecimal("100");
    private static final int MONEY_SCALE = 2;
    private static final int PCT_SCALE = 2;

    private final FeeGridRepository feeGridRepository;
    private final FeeBracketRepository feeBracketRepository;
    private final CommissionRuleRepository commissionRuleRepository;
    private final CurrencyRepository currencyRepository;
    private final CountryRepository countryRepository;
    private final TransferCorridorRepository transferCorridorRepository;
    private final UserRepository userRepository;
    private final AuditLogRepository auditLogRepository;
    private final FeeAuditService auditService;

    public AdminFeeService(
            FeeGridRepository feeGridRepository,
            FeeBracketRepository feeBracketRepository,
            CommissionRuleRepository commissionRuleRepository,
            CurrencyRepository currencyRepository,
            CountryRepository countryRepository,
            TransferCorridorRepository transferCorridorRepository,
            UserRepository userRepository,
            AuditLogRepository auditLogRepository,
            FeeAuditService auditService
    ) {
        this.feeGridRepository = feeGridRepository;
        this.feeBracketRepository = feeBracketRepository;
        this.commissionRuleRepository = commissionRuleRepository;
        this.currencyRepository = currencyRepository;
        this.countryRepository = countryRepository;
        this.transferCorridorRepository = transferCorridorRepository;
        this.userRepository = userRepository;
        this.auditLogRepository = auditLogRepository;
        this.auditService = auditService;
    }

    // ---------- Read ----------

    @Transactional(readOnly = true)
    public FeeSummaryDTO getSummary() {
        List<FeeGrid> grids = feeGridRepository.findAll();
        long activeGrids = feeGridRepository.countByActive(true);

        BigDecimal feeSum = BigDecimal.ZERO;
        int feeCount = 0;
        BigDecimal centralSum = BigDecimal.ZERO;
        BigDecimal agencySum = BigDecimal.ZERO;
        int commissionCount = 0;

        for (FeeGrid grid : grids) {
            FeeBracket bracket = feeBracketRepository
                    .findFirstByFeeGrid_IdOrderByMinAmountAsc(grid.getId())
                    .orElse(null);
            if (bracket != null && bracket.getFeeValue() != null) {
                feeSum = feeSum.add(bracket.getFeeValue());
                feeCount++;
            }
            CommissionRule rule = commissionRuleRepository
                    .findFirstByFeeGrid_IdOrderByIdAsc(grid.getId())
                    .orElse(null);
            if (rule != null) {
                if (rule.getCentralPercentage() != null) {
                    centralSum = centralSum.add(rule.getCentralPercentage());
                }
                if (rule.getAgencyPercentage() != null) {
                    agencySum = agencySum.add(rule.getAgencyPercentage());
                }
                commissionCount++;
            }
        }

        BigDecimal averageFee = feeCount == 0
                ? BigDecimal.ZERO
                : feeSum.divide(BigDecimal.valueOf(feeCount), MONEY_SCALE, RoundingMode.HALF_UP);
        BigDecimal centralCommission = commissionCount == 0
                ? BigDecimal.ZERO
                : centralSum.divide(BigDecimal.valueOf(commissionCount), PCT_SCALE, RoundingMode.HALF_UP);
        BigDecimal agencyCommission = commissionCount == 0
                ? BigDecimal.ZERO
                : agencySum.divide(BigDecimal.valueOf(commissionCount), PCT_SCALE, RoundingMode.HALF_UP);

        long simulationsToday = countSimulationsToday();

        return new FeeSummaryDTO(
                activeGrids,
                averageFee,
                centralCommission,
                agencyCommission,
                simulationsToday
        );
    }

    @Transactional(readOnly = true)
    public List<FeeGridResponseDTO> findAllGrids() {
        List<FeeGrid> grids = feeGridRepository.findAllByOrderByCreatedAtDesc();
        List<FeeGridResponseDTO> responses = new ArrayList<>(grids.size());
        for (FeeGrid grid : grids) {
            responses.add(toResponse(grid));
        }
        return responses;
    }

    @Transactional(readOnly = true)
    public FeeGridResponseDTO findGridById(Long id) {
        FeeGrid grid = feeGridRepository.findById(id)
                .orElseThrow(() -> new FeeGridNotFoundException(id));
        return toResponse(grid);
    }

    // ---------- Write ----------

    @Transactional
    public FeeGridResponseDTO createGrid(CreateFeeGridRequestDTO request, Authentication authentication) {
        validateRequest(request);

        Currency currency = resolveCurrencyOrFail(request.currency());
        TransferCorridor corridor = resolveCorridor(request.sourceCountry(), request.destinationCountry());

        LocalDateTime now = LocalDateTime.now();
        FeeGrid grid = new FeeGrid();
        grid.setName(request.name().trim());
        grid.setCurrency(currency);
        grid.setCorridor(corridor);
        FeeGridStatus status = request.status() == null ? FeeGridStatus.DRAFT : request.status();
        applyStatus(grid, status, now);
        grid.setCreatedBy(currentUserOrNull(authentication));
        grid.setCreatedAt(now);
        grid.setUpdatedAt(now);
        FeeGrid saved = feeGridRepository.save(grid);

        // Persist the bracket + rule that back the flat admin DTO.
        FeeBracket bracket = new FeeBracket();
        bracket.setFeeGrid(saved);
        bracket.setMinAmount(request.minAmount());
        bracket.setMaxAmount(request.maxAmount());
        bracket.setFeeType(FEE_TYPE_PERCENT);
        bracket.setFeeValue(scalePct(request.percentageFee()));
        bracket.setCreatedAt(now);
        feeBracketRepository.save(bracket);

        if (request.fixedFee() != null && request.fixedFee().compareTo(BigDecimal.ZERO) > 0) {
            FeeBracket fixedBracket = new FeeBracket();
            fixedBracket.setFeeGrid(saved);
            fixedBracket.setMinAmount(request.minAmount());
            fixedBracket.setMaxAmount(request.maxAmount());
            fixedBracket.setFeeType(FEE_TYPE_FIXED);
            fixedBracket.setFeeValue(scaleMoney(request.fixedFee()));
            fixedBracket.setCreatedAt(now);
            feeBracketRepository.save(fixedBracket);
        }

        CommissionRule rule = new CommissionRule();
        rule.setFeeGrid(saved);
        rule.setAgencyPercentage(scalePct(request.agencyCommissionRate()));
        rule.setCentralPercentage(scalePct(request.centralCommissionRate()));
        rule.setActive(true);
        rule.setCreatedAt(now);
        commissionRuleRepository.save(rule);

        auditService.logFeeGridCreated(currentUserOrNull(authentication), saved);
        return toResponse(saved);
    }

    @Transactional
    public FeeGridResponseDTO updateGrid(
            Long id,
            CreateFeeGridRequestDTO request,
            Authentication authentication
    ) {
        validateRequest(request);

        FeeGrid grid = feeGridRepository.findById(id)
                .orElseThrow(() -> new FeeGridNotFoundException(id));
        Currency currency = resolveCurrencyOrFail(request.currency());
        TransferCorridor corridor = resolveCorridor(request.sourceCountry(), request.destinationCountry());

        LocalDateTime now = LocalDateTime.now();
        grid.setName(request.name().trim());
        grid.setCurrency(currency);
        grid.setCorridor(corridor);
        FeeGridStatus status = request.status() == null ? resolveStatus(grid) : request.status();
        applyStatus(grid, status, now);
        grid.setUpdatedAt(now);
        FeeGrid saved = feeGridRepository.save(grid);

        // Replace the bracket + rule with the new flat values: simpler than
        // diffing partial bracket lists for the admin admin UI.
        for (FeeBracket bracket : feeBracketRepository.findByFeeGrid_IdOrderByMinAmountAsc(saved.getId())) {
            feeBracketRepository.delete(bracket);
        }
        FeeBracket pct = new FeeBracket();
        pct.setFeeGrid(saved);
        pct.setMinAmount(request.minAmount());
        pct.setMaxAmount(request.maxAmount());
        pct.setFeeType(FEE_TYPE_PERCENT);
        pct.setFeeValue(scalePct(request.percentageFee()));
        pct.setCreatedAt(now);
        feeBracketRepository.save(pct);
        if (request.fixedFee() != null && request.fixedFee().compareTo(BigDecimal.ZERO) > 0) {
            FeeBracket fix = new FeeBracket();
            fix.setFeeGrid(saved);
            fix.setMinAmount(request.minAmount());
            fix.setMaxAmount(request.maxAmount());
            fix.setFeeType(FEE_TYPE_FIXED);
            fix.setFeeValue(scaleMoney(request.fixedFee()));
            fix.setCreatedAt(now);
            feeBracketRepository.save(fix);
        }

        CommissionRule rule = commissionRuleRepository
                .findFirstByFeeGrid_IdOrderByIdAsc(saved.getId())
                .orElseGet(() -> {
                    CommissionRule r = new CommissionRule();
                    r.setFeeGrid(saved);
                    r.setActive(true);
                    r.setCreatedAt(now);
                    return r;
                });
        rule.setAgencyPercentage(scalePct(request.agencyCommissionRate()));
        rule.setCentralPercentage(scalePct(request.centralCommissionRate()));
        commissionRuleRepository.save(rule);

        auditService.logFeeGridUpdated(currentUserOrNull(authentication), saved);
        return toResponse(saved);
    }

    @Transactional
    public FeeGridResponseDTO changeStatus(
            Long id,
            ChangeFeeGridStatusRequestDTO request,
            Authentication authentication
    ) {
        FeeGrid grid = feeGridRepository.findById(id)
                .orElseThrow(() -> new FeeGridNotFoundException(id));
        applyStatus(grid, request.status(), LocalDateTime.now());
        grid.setUpdatedAt(LocalDateTime.now());
        FeeGrid saved = feeGridRepository.save(grid);

        auditService.logFeeGridStatusChanged(currentUserOrNull(authentication), saved, request.status().name());
        return toResponse(saved);
    }

    @Transactional
    public FeeGridResponseDTO duplicateGrid(Long id, Authentication authentication) {
        FeeGrid source = feeGridRepository.findById(id)
                .orElseThrow(() -> new FeeGridNotFoundException(id));

        LocalDateTime now = LocalDateTime.now();
        FeeGrid copy = new FeeGrid();
        copy.setName(source.getName() + " (copie)");
        copy.setCurrency(source.getCurrency());
        copy.setCorridor(source.getCorridor());
        copy.setActive(false);
        copy.setEffectiveFrom(null);
        copy.setEffectiveTo(null);
        copy.setCreatedBy(currentUserOrNull(authentication));
        copy.setCreatedAt(now);
        copy.setUpdatedAt(now);
        FeeGrid savedCopy = feeGridRepository.save(copy);

        for (FeeBracket bracket : feeBracketRepository.findByFeeGrid_IdOrderByMinAmountAsc(source.getId())) {
            FeeBracket clone = new FeeBracket();
            clone.setFeeGrid(savedCopy);
            clone.setMinAmount(bracket.getMinAmount());
            clone.setMaxAmount(bracket.getMaxAmount());
            clone.setFeeType(bracket.getFeeType());
            clone.setFeeValue(bracket.getFeeValue());
            clone.setCreatedAt(now);
            feeBracketRepository.save(clone);
        }

        commissionRuleRepository.findFirstByFeeGrid_IdOrderByIdAsc(source.getId())
                .ifPresent(rule -> {
                    CommissionRule cloneRule = new CommissionRule();
                    cloneRule.setFeeGrid(savedCopy);
                    cloneRule.setAgencyPercentage(rule.getAgencyPercentage());
                    cloneRule.setCentralPercentage(rule.getCentralPercentage());
                    cloneRule.setActive(true);
                    cloneRule.setCreatedAt(now);
                    commissionRuleRepository.save(cloneRule);
                });

        auditService.logFeeGridDuplicated(currentUserOrNull(authentication), source, savedCopy);
        return toResponse(savedCopy);
    }

    // ---------- Simulation ----------

    @Transactional
    public FeeSimulationResponseDTO simulate(FeeSimulationRequestDTO request, Authentication authentication) {
        if (request.amount() == null || request.amount().signum() <= 0) {
            throw new InvalidFeeGridException("Le montant doit être strictement positif.");
        }
        FeeGrid grid = findActiveMatchingGrid(
                request.currency(),
                request.sourceCountry(),
                request.destinationCountry()
        ).orElseThrow(() -> new NoActiveFeeGridException(
                "Aucune grille active pour " + request.sourceCountry() + " → " + request.destinationCountry()
                        + " (" + request.currency() + ")"));

        BigDecimal amount = scaleMoney(request.amount());
        BigDecimal fixedFee = sumFixedFee(grid);
        BigDecimal pctFee = firstPercentageFee(grid);
        BigDecimal feeFromPct = amount.multiply(pctFee).divide(HUNDRED, MONEY_SCALE, RoundingMode.HALF_UP);
        BigDecimal totalFee = scaleMoney(fixedFee.add(feeFromPct));
        BigDecimal net = scaleMoney(amount.subtract(totalFee));
        BigDecimal agencyShare = BigDecimal.ZERO;
        BigDecimal centralShare = BigDecimal.ZERO;
        CommissionRule rule = commissionRuleRepository
                .findFirstByFeeGrid_IdOrderByIdAsc(grid.getId())
                .orElse(null);
        if (rule != null) {
            agencyShare = scaleMoney(totalFee.multiply(scalePct(rule.getAgencyPercentage())).divide(HUNDRED, MONEY_SCALE, RoundingMode.HALF_UP));
            centralShare = scaleMoney(totalFee.multiply(scalePct(rule.getCentralPercentage())).divide(HUNDRED, MONEY_SCALE, RoundingMode.HALF_UP));
        }

        auditService.logFeeSimulated(
                currentUserOrNull(authentication),
                request.sourceCountry() + " → " + request.destinationCountry(),
                request.currency()
        );

        return new FeeSimulationResponseDTO(
                amount,
                totalFee,
                net,
                agencyShare,
                centralShare,
                grid.getName(),
                grid.getId(),
                grid.getCurrency() != null ? grid.getCurrency().getCode() : request.currency()
        );
    }

    // ---------- Commissions ----------

    @Transactional(readOnly = true)
    public List<CommissionResponseDTO> findCommissionsBreakdown() {
        // The Transfers / Payments aggregation needed to compute per-agency
        // commission volumes will be wired in the next phase. For now we
        // return an empty list so the UI keeps its commissions section empty
        // state intact.
        // TODO: aggregate from Transfer + CommissionRule once Reporting ships.
        return List.of();
    }

    // ---------- Helpers ----------

    private void validateRequest(CreateFeeGridRequestDTO request) {
        if (request.minAmount().compareTo(request.maxAmount()) >= 0) {
            throw new InvalidFeeGridException("Le montant maximum doit être supérieur au minimum.");
        }
        String src = request.sourceCountry().trim().toUpperCase(Locale.ROOT);
        String dst = request.destinationCountry().trim().toUpperCase(Locale.ROOT);
        if (src.equalsIgnoreCase(dst)) {
            throw new InvalidFeeGridException("Le pays source et le pays destination doivent différer.");
        }
        BigDecimal totalCommission = request.agencyCommissionRate().add(request.centralCommissionRate());
        if (totalCommission.compareTo(HUNDRED) > 0) {
            throw new InvalidFeeGridException(
                    "La somme des commissions agence + centrale ne peut pas dépasser 100%.");
        }
    }

    private Currency resolveCurrencyOrFail(String code) {
        if (code == null || code.isBlank()) {
            throw new InvalidFeeGridException("La devise est obligatoire.");
        }
        return currencyRepository
                .findByCode(code.trim().toUpperCase(Locale.ROOT))
                .orElseThrow(() -> new InvalidFeeGridException("Devise inconnue : " + code));
    }

    /**
     * Best-effort corridor lookup: when both country codes match an existing
     * Country pair we return the corresponding {@link TransferCorridor};
     * otherwise we leave the grid corridor-less (the entity column is
     * nullable). The grid still exposes the source/destination via the DTO.
     */
    private TransferCorridor resolveCorridor(String sourceCountry, String destCountry) {
        Optional<Country> source = countryRepository.findByCode(sourceCountry.trim().toUpperCase(Locale.ROOT));
        Optional<Country> dest = countryRepository.findByCode(destCountry.trim().toUpperCase(Locale.ROOT));
        if (source.isEmpty() || dest.isEmpty()) {
            return null;
        }
        return transferCorridorRepository
                .findBySourceCountry_IdAndDestinationCountry_Id(source.get().getId(), dest.get().getId())
                .orElse(null);
    }

    private Optional<FeeGrid> findActiveMatchingGrid(String currency, String source, String dest) {
        if (currency == null) return Optional.empty();
        String code = currency.trim().toUpperCase(Locale.ROOT);
        for (FeeGrid grid : feeGridRepository.findAll()) {
            if (!Boolean.TRUE.equals(grid.getActive())) continue;
            if (grid.getCurrency() == null || !code.equals(grid.getCurrency().getCode())) continue;
            TransferCorridor corridor = grid.getCorridor();
            if (corridor != null && corridor.getSourceCountry() != null && corridor.getDestinationCountry() != null) {
                String src = safeUpper(corridor.getSourceCountry().getCode());
                String dst = safeUpper(corridor.getDestinationCountry().getCode());
                if (!safeUpper(source).equals(src) || !safeUpper(dest).equals(dst)) continue;
            }
            return Optional.of(grid);
        }
        // Fallback: pick the first active grid with the same currency,
        // useful when admin grids are not yet bound to a Country pair.
        for (FeeGrid grid : feeGridRepository.findAll()) {
            if (Boolean.TRUE.equals(grid.getActive()) && grid.getCurrency() != null
                    && code.equals(grid.getCurrency().getCode())) {
                return Optional.of(grid);
            }
        }
        return Optional.empty();
    }

    private BigDecimal sumFixedFee(FeeGrid grid) {
        BigDecimal total = BigDecimal.ZERO;
        for (FeeBracket bracket : feeBracketRepository.findByFeeGrid_IdOrderByMinAmountAsc(grid.getId())) {
            if (FEE_TYPE_FIXED.equalsIgnoreCase(bracket.getFeeType()) && bracket.getFeeValue() != null) {
                total = total.add(bracket.getFeeValue());
            }
        }
        return total;
    }

    private BigDecimal firstPercentageFee(FeeGrid grid) {
        for (FeeBracket bracket : feeBracketRepository.findByFeeGrid_IdOrderByMinAmountAsc(grid.getId())) {
            if (FEE_TYPE_PERCENT.equalsIgnoreCase(bracket.getFeeType()) && bracket.getFeeValue() != null) {
                return bracket.getFeeValue();
            }
        }
        return BigDecimal.ZERO;
    }

    private FeeGridResponseDTO toResponse(FeeGrid grid) {
        FeeBracket pctBracket = null;
        BigDecimal fixedFee = BigDecimal.ZERO;
        BigDecimal min = BigDecimal.ZERO;
        BigDecimal max = BigDecimal.ZERO;

        for (FeeBracket bracket : feeBracketRepository.findByFeeGrid_IdOrderByMinAmountAsc(grid.getId())) {
            if (FEE_TYPE_FIXED.equalsIgnoreCase(bracket.getFeeType())) {
                if (bracket.getFeeValue() != null) {
                    fixedFee = fixedFee.add(bracket.getFeeValue());
                }
            } else if (pctBracket == null) {
                pctBracket = bracket;
            }
            if (pctBracket == null) {
                if (bracket.getMinAmount() != null) min = bracket.getMinAmount();
                if (bracket.getMaxAmount() != null) max = bracket.getMaxAmount();
            }
        }
        if (pctBracket != null) {
            min = pctBracket.getMinAmount() != null ? pctBracket.getMinAmount() : min;
            max = pctBracket.getMaxAmount() != null ? pctBracket.getMaxAmount() : max;
        }
        BigDecimal pctFee = pctBracket != null && pctBracket.getFeeValue() != null
                ? pctBracket.getFeeValue()
                : BigDecimal.ZERO;

        CommissionRule rule = commissionRuleRepository
                .findFirstByFeeGrid_IdOrderByIdAsc(grid.getId())
                .orElse(null);
        BigDecimal agencyPct = rule != null && rule.getAgencyPercentage() != null
                ? rule.getAgencyPercentage()
                : BigDecimal.ZERO;
        BigDecimal centralPct = rule != null && rule.getCentralPercentage() != null
                ? rule.getCentralPercentage()
                : BigDecimal.ZERO;

        TransferCorridor corridor = grid.getCorridor();
        Country source = corridor != null ? corridor.getSourceCountry() : null;
        Country dest = corridor != null ? corridor.getDestinationCountry() : null;

        String corridorLabel = (source != null && dest != null)
                ? source.getCode() + " → " + dest.getCode()
                : "—";

        return new FeeGridResponseDTO(
                grid.getId(),
                grid.getName(),
                corridorLabel,
                source != null ? source.getCode() : null,
                source != null ? source.getName() : null,
                dest != null ? dest.getCode() : null,
                dest != null ? dest.getName() : null,
                grid.getCurrency() != null ? grid.getCurrency().getCode() : null,
                scaleMoney(min),
                scaleMoney(max),
                scaleMoney(fixedFee),
                scalePct(pctFee),
                scalePct(agencyPct),
                scalePct(centralPct),
                resolveStatus(grid),
                grid.getCreatedAt(),
                grid.getUpdatedAt()
        );
    }

    private FeeGridStatus resolveStatus(FeeGrid grid) {
        if (!Boolean.TRUE.equals(grid.getActive())) {
            return FeeGridStatus.SUSPENDED;
        }
        if (grid.getEffectiveFrom() == null) {
            return FeeGridStatus.DRAFT;
        }
        return FeeGridStatus.ACTIVE;
    }

    private void applyStatus(FeeGrid grid, FeeGridStatus status, LocalDateTime now) {
        switch (status) {
            case ACTIVE -> {
                grid.setActive(true);
                if (grid.getEffectiveFrom() == null) {
                    grid.setEffectiveFrom(now);
                }
            }
            case SUSPENDED -> {
                grid.setActive(false);
            }
            case DRAFT -> {
                grid.setActive(true);
                grid.setEffectiveFrom(null);
            }
        }
    }

    private long countSimulationsToday() {
        try {
            LocalDate today = LocalDate.now();
            return auditLogRepository.countByActionAndCreatedAtBetween(
                    "FEE_SIMULATED",
                    today.atStartOfDay(),
                    today.atTime(LocalTime.MAX)
            );
        } catch (RuntimeException ex) {
            return 0L;
        }
    }

    private BigDecimal scaleMoney(BigDecimal value) {
        if (value == null) return BigDecimal.ZERO;
        return value.setScale(MONEY_SCALE, RoundingMode.HALF_UP);
    }

    private BigDecimal scalePct(BigDecimal value) {
        if (value == null) return BigDecimal.ZERO;
        return value.setScale(PCT_SCALE, RoundingMode.HALF_UP);
    }

    private String safeUpper(String value) {
        return value == null ? "" : value.trim().toUpperCase(Locale.ROOT);
    }

    private User currentUserOrNull(Authentication authentication) {
        if (authentication == null) return null;
        if (authentication.getPrincipal() instanceof OkaneUserPrincipal principal) {
            User user = principal.getUser();
            if (user == null || user.getId() == null) return null;
            return userRepository.findById(user.getId()).orElse(null);
        }
        return null;
    }
}
