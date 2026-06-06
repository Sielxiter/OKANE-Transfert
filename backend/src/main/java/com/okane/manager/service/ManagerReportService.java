package com.okane.manager.service;

import com.okane.agency.entity.Agency;
import com.okane.agency.entity.AgencyUser;
import com.okane.agency.repository.AgencyUserRepository;
import com.okane.auth.entity.User;
import com.okane.auth.exception.ApiException;
import com.okane.auth.repository.UserRepository;
import com.okane.auth.security.OkaneUserPrincipal;
import com.okane.feescommission.entity.CommissionRule;
import com.okane.feescommission.entity.FeeGrid;
import com.okane.feescommission.repository.CommissionRuleRepository;
import com.okane.feescommission.repository.FeeGridRepository;
import com.okane.manager.dto.ManagerDailyReportResponse;
import com.okane.manager.dto.ManagerRevenueDayLine;
import com.okane.manager.dto.ManagerReportSummaryResponse;
import com.okane.manager.dto.ManagerRevenueReportResponse;
import com.okane.manager.dto.ManagerTransferReportLine;
import com.okane.transfer.entity.Transfer;
import com.okane.transfer.repository.TransferRepository;
import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;
import java.time.format.DateTimeFormatter;
import java.util.ArrayList;
import java.util.Collection;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.TreeMap;
import org.springframework.http.HttpStatus;
import org.springframework.security.core.Authentication;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class ManagerReportService {

    private static final String DEFAULT_CURRENCY = "MAD";
    private static final List<String> PAID_STATUSES = List.of("PAID", "PAYE", "PAYÉ");
    private static final List<String> PENDING_STATUSES = List.of("PENDING", "EN_ATTENTE");
    private static final List<String> CANCELLED_STATUSES = List.of("CANCELLED", "ANNULE", "ANNULÉ");
    private static final List<String> EXPIRED_STATUSES = List.of("EXPIRED", "EXPIRE", "EXPIRÉ");

    private final TransferRepository transferRepository;
    private final CommissionRuleRepository commissionRuleRepository;
    private final FeeGridRepository feeGridRepository;
    private final UserRepository userRepository;
    private final AgencyUserRepository agencyUserRepository;

    public ManagerReportService(
            TransferRepository transferRepository,
            CommissionRuleRepository commissionRuleRepository,
            FeeGridRepository feeGridRepository,
            UserRepository userRepository,
            AgencyUserRepository agencyUserRepository
    ) {
        this.transferRepository = transferRepository;
        this.commissionRuleRepository = commissionRuleRepository;
        this.feeGridRepository = feeGridRepository;
        this.userRepository = userRepository;
        this.agencyUserRepository = agencyUserRepository;
    }

    // ── Rapport journalier ────────────────────────────────────────────────────
    @Transactional(readOnly = true)
    public ManagerDailyReportResponse getDailyReport(
            Authentication authentication,
            LocalDate date
    ) {
        Agency agency = resolveAgency(authentication);
        LocalDateTime start = date.atStartOfDay();
        LocalDateTime end = date.atTime(LocalTime.MAX);

        List<Transfer> transfers = transferRepository
                .findBySourceAgency_IdAndCreatedAtBetweenOrderByCreatedAtDesc(
                        agency.getId(), start, end
                );

        CommissionRates rates = resolveCommissionRates(agency);
        ManagerReportSummaryResponse summary = buildSummary(
                date.toString(), transfers, rates
        );

        List<ManagerTransferReportLine> lines = transfers.stream()
                .map(this::toTransferLine)
                .toList();

        return new ManagerDailyReportResponse(summary, lines);
    }

    // ── Rapport CA sur une période ────────────────────────────────────────────
    @Transactional(readOnly = true)
    public ManagerRevenueReportResponse getRevenueReport(
            Authentication authentication,
            LocalDate periodStart,
            LocalDate periodEnd
    ) {
        if (periodStart.isAfter(periodEnd)) {
            throw new ApiException(HttpStatus.BAD_REQUEST,
                    "La date de début doit être avant la date de fin.");
        }
        if (periodStart.until(periodEnd, java.time.temporal.ChronoUnit.DAYS) > 90) {
            throw new ApiException(HttpStatus.BAD_REQUEST,
                    "La période ne peut pas dépasser 90 jours.");
        }

        Agency agency = resolveAgency(authentication);
        LocalDateTime start = periodStart.atStartOfDay();
        LocalDateTime end = periodEnd.atTime(LocalTime.MAX);

        List<Transfer> allTransfers = transferRepository
                .findBySourceAgency_IdAndCreatedAtBetweenOrderByCreatedAtDesc(
                        agency.getId(), start, end
                );

        CommissionRates rates = resolveCommissionRates(agency);

        // Grouper par jour
        Map<String, List<Transfer>> byDay = new TreeMap<>();
        for (Transfer t : allTransfers) {
            if (t.getCreatedAt() == null) continue;
            String day = t.getCreatedAt().toLocalDate().toString();
            byDay.computeIfAbsent(day, k -> new ArrayList<>()).add(t);
        }

        List<ManagerRevenueDayLine> dayLines = new ArrayList<>();
        double grandTotalCA = 0d;
        double grandTotalAgency = 0d;
        double grandTotalCentral = 0d;
        double grandTotalFees = 0d;
        int grandTotalPaid = 0;

        for (Map.Entry<String, List<Transfer>> entry : byDay.entrySet()) {
            List<Transfer> dayTransfers = entry.getValue();
            List<Transfer> paidTransfers = filterByStatuses(dayTransfers, PAID_STATUSES);

            double fees = sumFees(paidTransfers);
            double agencyCommission = round(fees * rates.agencyPct() / 100.0);
            double centralCommission = round(fees * rates.centralPct() / 100.0);
            double ca = agencyCommission;

            dayLines.add(new ManagerRevenueDayLine(
                    entry.getKey(),
                    paidTransfers.size(),
                    round(fees),
                    agencyCommission,
                    centralCommission,
                    ca
            ));

            grandTotalCA += ca;
            grandTotalAgency += agencyCommission;
            grandTotalCentral += centralCommission;
            grandTotalFees += fees;
            grandTotalPaid += paidTransfers.size();
        }

        return new ManagerRevenueReportResponse(
                periodStart.toString(),
                periodEnd.toString(),
                round(grandTotalCA),
                round(grandTotalAgency),
                round(grandTotalCentral),
                round(grandTotalFees),
                grandTotalPaid,
                DEFAULT_CURRENCY,
                dayLines
        );
    }

    // ── helpers privés ────────────────────────────────────────────────────────

    private ManagerReportSummaryResponse buildSummary(
            String date,
            List<Transfer> transfers,
            CommissionRates rates
    ) {
        List<Transfer> paid = filterByStatuses(transfers, PAID_STATUSES);
        List<Transfer> pending = filterByStatuses(transfers, PENDING_STATUSES);
        List<Transfer> cancelled = filterByStatuses(transfers, CANCELLED_STATUSES);
        List<Transfer> expired = filterByStatuses(transfers, EXPIRED_STATUSES);

        double totalSent = paid.stream()
                .mapToDouble(t -> t.getAmount() != null ? t.getAmount().doubleValue() : 0d)
                .sum();

        double totalFees = sumFees(paid);
        double agencyCommission = round(totalFees * rates.agencyPct() / 100.0);
        double centralCommission = round(totalFees * rates.centralPct() / 100.0);
        double ca = agencyCommission;

        return new ManagerReportSummaryResponse(
                date,
                transfers.size(),
                paid.size(),
                pending.size(),
                cancelled.size(),
                expired.size(),
                round(totalSent),
                round(totalFees),
                agencyCommission,
                centralCommission,
                ca,
                DEFAULT_CURRENCY
        );
    }

    private ManagerTransferReportLine toTransferLine(Transfer t) {
        String sourceCurrency = t.getCurrency() != null
                ? t.getCurrency().getCode() : DEFAULT_CURRENCY;
        String destCurrency = t.getDestinationCurrency() != null
                ? t.getDestinationCurrency().getCode() : sourceCurrency;
        String agentName = t.getCreatedBy() != null
                ? (t.getCreatedBy().getFirstName() + " " + t.getCreatedBy().getLastName()).trim()
                : null;

        return new ManagerTransferReportLine(
                t.getId() != null ? t.getId().toString() : null,
                t.getReferenceCode(),
                buildName(t.getSenderFirstName(), t.getSenderLastName()),
                t.getSenderPhone(),
                buildName(t.getBeneficiaryFirstName(), t.getBeneficiaryLastName()),
                t.getBeneficiaryPhone(),
                t.getBeneficiary() != null ? t.getBeneficiary().getCountry() : null,
                t.getAmount() != null ? t.getAmount().doubleValue() : 0d,
                t.getFeeAmount() != null ? t.getFeeAmount().doubleValue() : 0d,
                t.getNetAmount() != null ? t.getNetAmount().doubleValue() : 0d,
                t.getExchangeRate() != null ? t.getExchangeRate().doubleValue() : 1d,
                sourceCurrency,
                destCurrency,
                t.getStatus(),
                t.getCreatedAt() != null ? t.getCreatedAt().toString() : null,
                agentName
        );
    }

    // Résoudre les taux de commission depuis la grille tarifaire active
    private CommissionRates resolveCommissionRates(Agency agency) {
        // Chercher la règle de commission active (grille la plus récente)
        Optional<CommissionRule> rule = commissionRuleRepository
                .findFirstByFeeGrid_ActiveTrueOrderByFeeGrid_CreatedAtDesc();

        if (rule.isPresent()) {
            CommissionRule r = rule.get();
            double agencyPct = r.getAgencyPercentage() != null
                    ? r.getAgencyPercentage().doubleValue() : 40.0;
            double centralPct = r.getCentralPercentage() != null
                    ? r.getCentralPercentage().doubleValue() : 60.0;
            return new CommissionRates(agencyPct, centralPct);
        }
        // Valeurs par défaut si aucune grille configurée
        return new CommissionRates(40.0, 60.0);
    }

    private List<Transfer> filterByStatuses(List<Transfer> transfers, List<String> statuses) {
        return transfers.stream()
                .filter(t -> statuses.stream()
                        .anyMatch(s -> s.equalsIgnoreCase(t.getStatus())))
                .toList();
    }

    private double sumFees(List<Transfer> transfers) {
        return transfers.stream()
                .mapToDouble(t -> t.getFeeAmount() != null ? t.getFeeAmount().doubleValue() : 0d)
                .sum();
    }

    private double round(double value) {
        return BigDecimal.valueOf(value)
                .setScale(2, RoundingMode.HALF_UP)
                .doubleValue();
    }

    private String buildName(String firstName, String lastName) {
        return ((firstName != null ? firstName : "") + " "
                + (lastName != null ? lastName : "")).trim();
    }

    private Agency resolveAgency(Authentication authentication) {
        User user = resolveUser(authentication);
        AgencyUser agencyUser = agencyUserRepository
                .findFirstByUser_IdAndActiveTrue(user.getId())
                .orElseThrow(() -> new ApiException(HttpStatus.BAD_REQUEST,
                        "Manager non affecté à une agence."));
        return agencyUser.getAgency();
    }

    private User resolveUser(Authentication authentication) {
        if (!(authentication.getPrincipal() instanceof OkaneUserPrincipal principal)) {
            throw new ApiException(HttpStatus.UNAUTHORIZED, "Authentication required");
        }
        return userRepository.findById(principal.getUser().getId())
                .orElseThrow(() -> new ApiException(HttpStatus.UNAUTHORIZED,
                        "Authentication required"));
    }

    private record CommissionRates(double agencyPct, double centralPct) {}
}