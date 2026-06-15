package com.okane.feemanagement.service;

import com.okane.auth.entity.User;
import com.okane.auth.exception.ApiException;
import com.okane.auth.repository.AuditLogRepository;
import com.okane.auth.repository.UserRepository;
import com.okane.auth.security.OkaneUserPrincipal;
import com.okane.currencyfx.entity.TransferCorridor;
import com.okane.currencyfx.repository.TransferCorridorRepository;
import com.okane.feemanagement.domain.TariffValueType;
import com.okane.feemanagement.dto.CreateTariffLineRequestDTO;
import com.okane.feemanagement.dto.TariffLineResponseDTO;
import com.okane.feemanagement.dto.TariffSimulationRequestDTO;
import com.okane.feemanagement.dto.TariffSimulationResponseDTO;
import com.okane.feemanagement.dto.TariffSummaryDTO;
import com.okane.feemanagement.dto.UpdateTariffLineRequestDTO;
import com.okane.feemanagement.exception.TariffLineConflictException;
import com.okane.feemanagement.exception.TariffLineNotFoundException;
import com.okane.feescommission.entity.TariffLine;
import com.okane.feescommission.repository.TariffLineRepository;
import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.List;
import java.util.Locale;
import java.util.Optional;
import org.springframework.http.HttpStatus;
import org.springframework.security.core.Authentication;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class AdminFeeService {

    private static final BigDecimal HUNDRED = new BigDecimal("100");
    private static final int SCALE = 2;

    private final TariffLineRepository tariffLineRepository;
    private final TransferCorridorRepository transferCorridorRepository;
    private final UserRepository userRepository;
    private final AuditLogRepository auditLogRepository;
    private final FeeAuditService auditService;

    public AdminFeeService(
            TariffLineRepository tariffLineRepository,
            TransferCorridorRepository transferCorridorRepository,
            UserRepository userRepository,
            AuditLogRepository auditLogRepository,
            FeeAuditService auditService
    ) {
        this.tariffLineRepository = tariffLineRepository;
        this.transferCorridorRepository = transferCorridorRepository;
        this.userRepository = userRepository;
        this.auditLogRepository = auditLogRepository;
        this.auditService = auditService;
    }

    @Transactional(readOnly = true)
    public TariffSummaryDTO getSummary() {
        List<TariffLine> lines = tariffLineRepository.findAll();
        long fixedLines = lines.stream().filter(line -> line.getTransferFeeType() == TariffValueType.FIXED).count();
        long percentageLines = lines.stream().filter(line -> line.getTransferFeeType() == TariffValueType.PERCENT).count();
        return new TariffSummaryDTO(lines.size(), fixedLines, percentageLines, countSimulationsToday());
    }

    @Transactional(readOnly = true)
    public List<TariffLineResponseDTO> findAllLines() {
        List<TariffLine> lines = tariffLineRepository.findAllByOrderByMinAmountAscMaxAmountAsc();
        List<TariffLineResponseDTO> responses = new ArrayList<>(lines.size());
        for (TariffLine line : lines) {
            responses.add(toResponse(line));
        }
        return responses;
    }

    @Transactional(readOnly = true)
    public TariffLineResponseDTO findLineById(Long id) {
        TariffLine line = tariffLineRepository.findById(id)
                .orElseThrow(() -> new TariffLineNotFoundException(id));
        return toResponse(line);
    }

    @Transactional
    public TariffLineResponseDTO createLine(CreateTariffLineRequestDTO request, Authentication authentication) {
        validateRequest(request.minAmount(), request.maxAmount(), request.transferFeeType(),
                request.transferFeeValue(), request.agencyCommissionType(), request.agencyCommissionValue(),
                request.centralCommissionType(), request.centralCommissionValue(), null);

        LocalDateTime now = LocalDateTime.now();
        TariffLine line = new TariffLine();
        applyRequest(line, request.minAmount(), request.maxAmount(), request.transferFeeType(),
                request.transferFeeValue(), request.agencyCommissionType(), request.agencyCommissionValue(),
                request.centralCommissionType(), request.centralCommissionValue(), now);
        TariffLine saved = tariffLineRepository.save(line);
        auditService.logTariffLineCreated(currentUserOrNull(authentication), saved);
        return toResponse(saved);
    }

    @Transactional
    public TariffLineResponseDTO updateLine(Long id, UpdateTariffLineRequestDTO request, Authentication authentication) {
        TariffLine line = tariffLineRepository.findById(id)
                .orElseThrow(() -> new TariffLineNotFoundException(id));
        validateRequest(request.minAmount(), request.maxAmount(), request.transferFeeType(),
                request.transferFeeValue(), request.agencyCommissionType(), request.agencyCommissionValue(),
                request.centralCommissionType(), request.centralCommissionValue(), id);

        applyRequest(line, request.minAmount(), request.maxAmount(), request.transferFeeType(),
                request.transferFeeValue(), request.agencyCommissionType(), request.agencyCommissionValue(),
                request.centralCommissionType(), request.centralCommissionValue(), LocalDateTime.now());
        TariffLine saved = tariffLineRepository.save(line);
        auditService.logTariffLineUpdated(currentUserOrNull(authentication), saved);
        return toResponse(saved);
    }

    @Transactional
    public void deleteLine(Long id, Authentication authentication) {
        TariffLine line = tariffLineRepository.findById(id)
                .orElseThrow(() -> new TariffLineNotFoundException(id));
        auditService.logTariffLineDeleted(currentUserOrNull(authentication), line);
        tariffLineRepository.delete(line);
    }

    @Transactional
    public TariffSimulationResponseDTO simulate(TariffSimulationRequestDTO request, Authentication authentication) {
        if (request.amount() == null || request.amount().signum() <= 0) {
            throw new ApiException(HttpStatus.BAD_REQUEST, "Le montant doit etre strictement positif.");
        }

        TariffLine line = resolveLineForAmount(request.amount());
        TransferCorridor corridor = transferCorridorRepository.findById(request.corridorId())
                .orElseThrow(() -> new ApiException(HttpStatus.BAD_REQUEST, "Corridor introuvable."));
        if (!Boolean.TRUE.equals(corridor.getActive())) {
            throw new ApiException(HttpStatus.BAD_REQUEST, "Le corridor selectionne est inactif.");
        }
        if (corridor.getEstimatedFees() == null) {
            throw new ApiException(HttpStatus.BAD_REQUEST, "Le corridor selectionne n'a pas de pourcentage defini.");
        }

        BigDecimal amount = scaleMoney(request.amount());
        BigDecimal baseTransferFee = computeFee(line.getTransferFeeType(), line.getTransferFeeValue(), amount);
        BigDecimal corridorPercent = scalePct(corridor.getEstimatedFees());
        BigDecimal corridorFee = scaleMoney(amount.multiply(corridorPercent).divide(HUNDRED, SCALE, RoundingMode.HALF_UP));
        BigDecimal finalTransferFee = scaleMoney(baseTransferFee.add(corridorFee));
        BigDecimal agencyCommission = computeFee(line.getAgencyCommissionType(), line.getAgencyCommissionValue(), finalTransferFee);
        BigDecimal centralCommission = computeFee(line.getCentralCommissionType(), line.getCentralCommissionValue(), finalTransferFee);

        if (agencyCommission.add(centralCommission).compareTo(finalTransferFee) != 0) {
            throw new ApiException(
                    HttpStatus.BAD_REQUEST,
                    "La configuration de la grille est incoherente : commission agence + centrale doit etre egale au transfert total."
            );
        }

        auditService.logTariffSimulated(
                currentUserOrNull(authentication),
                corridorLabel(corridor),
                formatAmount(amount)
        );

        return new TariffSimulationResponseDTO(
                amount,
                baseTransferFee,
                corridorPercent,
                corridorFee,
                finalTransferFee,
                agencyCommission,
                centralCommission,
                line.getId(),
                corridor.getId()
        );
    }

    @Transactional(readOnly = true)
    public TariffLineResponseDTO getTariffForAmount(BigDecimal amount) {
        return toResponse(resolveLineForAmount(amount));
    }

    private void validateRequest(
            BigDecimal minAmount,
            BigDecimal maxAmount,
            TariffValueType transferFeeType,
            BigDecimal transferFeeValue,
            TariffValueType agencyCommissionType,
            BigDecimal agencyCommissionValue,
            TariffValueType centralCommissionType,
            BigDecimal centralCommissionValue,
            Long currentId
    ) {
        if (minAmount.compareTo(maxAmount) >= 0) {
            throw new ApiException(HttpStatus.BAD_REQUEST, "Le montant maximum doit etre superieur au minimum.");
        }
        validateNoOverlap(minAmount, maxAmount, currentId);
        if (transferFeeType == null || agencyCommissionType == null || centralCommissionType == null) {
            throw new ApiException(HttpStatus.BAD_REQUEST, "Les types de frais sont obligatoires.");
        }
        if (transferFeeValue == null || agencyCommissionValue == null || centralCommissionValue == null) {
            throw new ApiException(HttpStatus.BAD_REQUEST, "Les valeurs de frais sont obligatoires.");
        }
        if (agencyCommissionType != centralCommissionType) {
            throw new ApiException(HttpStatus.BAD_REQUEST,
                    "La commission agence et la commission centrale doivent utiliser le meme type.");
        }
        if (transferFeeType == TariffValueType.PERCENT && agencyCommissionType != TariffValueType.PERCENT) {
            throw new ApiException(HttpStatus.BAD_REQUEST,
                    "Quand le transfert est en pourcentage, les commissions doivent aussi etre en pourcentage.");
        }
        if (transferFeeType == TariffValueType.PERCENT) {
            if (agencyCommissionValue.add(centralCommissionValue).compareTo(HUNDRED) != 0) {
                throw new ApiException(HttpStatus.BAD_REQUEST,
                        "La somme commission agence + commission centrale doit etre egale a 100%.");
            }
            return;
        }

        if (agencyCommissionType == TariffValueType.FIXED) {
            if (agencyCommissionValue.add(centralCommissionValue).compareTo(transferFeeValue) != 0) {
                throw new ApiException(HttpStatus.BAD_REQUEST,
                        "La somme commission agence + commission centrale doit etre egale au frais de transfert.");
            }
            return;
        }

        if (agencyCommissionValue.add(centralCommissionValue).compareTo(HUNDRED) != 0) {
            throw new ApiException(HttpStatus.BAD_REQUEST,
                    "La somme commission agence + commission centrale doit etre egale a 100%.");
        }
    }

    private void validateNoOverlap(BigDecimal minAmount, BigDecimal maxAmount, Long currentId) {
        for (TariffLine existing : tariffLineRepository.findAll()) {
            if (currentId != null && currentId.equals(existing.getId())) {
                continue;
            }
            boolean overlaps = minAmount.compareTo(existing.getMaxAmount()) <= 0
                    && maxAmount.compareTo(existing.getMinAmount()) >= 0;
            if (overlaps) {
                throw new TariffLineConflictException(
                        "La tranche chevauche une autre grille tarifaire existante."
                );
            }
        }
    }

    private void applyRequest(
            TariffLine line,
            BigDecimal minAmount,
            BigDecimal maxAmount,
            TariffValueType transferFeeType,
            BigDecimal transferFeeValue,
            TariffValueType agencyCommissionType,
            BigDecimal agencyCommissionValue,
            TariffValueType centralCommissionType,
            BigDecimal centralCommissionValue,
            LocalDateTime now
    ) {
        line.setMinAmount(scaleMoney(minAmount));
        line.setMaxAmount(scaleMoney(maxAmount));
        line.setTransferFeeType(transferFeeType);
        line.setTransferFeeValue(scaleMoney(transferFeeValue));
        line.setAgencyCommissionType(agencyCommissionType);
        line.setAgencyCommissionValue(scaleMoney(agencyCommissionValue));
        line.setCentralCommissionType(centralCommissionType);
        line.setCentralCommissionValue(scaleMoney(centralCommissionValue));
        if (line.getCreatedAt() == null) {
            line.setCreatedAt(now);
        }
        line.setUpdatedAt(now);
    }

    private TariffLine resolveLineForAmount(BigDecimal amount) {
        BigDecimal normalizedAmount = scaleMoney(amount);
        List<TariffLine> matches = tariffLineRepository.findAll().stream()
                .filter(line -> normalizedAmount.compareTo(line.getMinAmount()) >= 0
                        && normalizedAmount.compareTo(line.getMaxAmount()) <= 0)
                .sorted(Comparator.comparing(TariffLine::getMinAmount).thenComparing(TariffLine::getMaxAmount))
                .toList();
        if (matches.isEmpty()) {
            throw new ApiException(HttpStatus.BAD_REQUEST,
                    "Aucune grille tarifaire ne correspond a ce montant.");
        }
        if (matches.size() > 1) {
            throw new TariffLineConflictException(
                    "Plusieurs grilles tarifaires correspondent a ce montant. Corrigez les chevauchements."
            );
        }
        return matches.get(0);
    }

    private TariffLineResponseDTO toResponse(TariffLine line) {
        return new TariffLineResponseDTO(
                line.getId(),
                scaleMoney(line.getMinAmount()),
                scaleMoney(line.getMaxAmount()),
                line.getTransferFeeType(),
                scaleMoney(line.getTransferFeeValue()),
                line.getAgencyCommissionType(),
                scaleMoney(line.getAgencyCommissionValue()),
                line.getCentralCommissionType(),
                scaleMoney(line.getCentralCommissionValue()),
                line.getCreatedAt(),
                line.getUpdatedAt()
        );
    }

    private BigDecimal computeFee(TariffValueType type, BigDecimal value, BigDecimal baseAmount) {
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

    private BigDecimal scalePct(BigDecimal value) {
        if (value == null) {
            return BigDecimal.ZERO;
        }
        return value.setScale(SCALE, RoundingMode.HALF_UP);
    }

    private long countSimulationsToday() {
        try {
            LocalDate today = LocalDate.now();
            return auditLogRepository.countByActionAndCreatedAtBetween(
                    "TARIFF_SIMULATED",
                    today.atStartOfDay(),
                    today.atTime(LocalTime.MAX)
            );
        } catch (RuntimeException ex) {
            return 0L;
        }
    }

    private String corridorLabel(TransferCorridor corridor) {
        if (corridor == null || corridor.getSourceCountry() == null || corridor.getDestinationCountry() == null) {
            return "Corridor";
        }
        return corridor.getSourceCountry().getCode() + " -> " + corridor.getDestinationCountry().getCode();
    }

    private String formatAmount(BigDecimal amount) {
        return amount == null ? "0.00" : scaleMoney(amount).toPlainString();
    }

    private User currentUserOrNull(Authentication authentication) {
        if (authentication == null) {
            return null;
        }
        if (authentication.getPrincipal() instanceof OkaneUserPrincipal principal) {
            User user = principal.getUser();
            if (user == null || user.getId() == null) {
                return null;
            }
            return userRepository.findById(user.getId()).orElse(null);
        }
        return null;
    }
}
