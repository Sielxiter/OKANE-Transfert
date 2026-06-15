package com.okane.reportmanagement.service;

import com.okane.reportmanagement.domain.ReportPeriod;
import com.okane.reportmanagement.domain.ReportStatus;
import com.okane.reportmanagement.domain.ReportType;
import com.okane.reportmanagement.dto.AgencyPerformanceDTO;
import com.okane.reportmanagement.dto.ExportReportResponseDTO;
import com.okane.reportmanagement.dto.ReportAnalyticsDTO;
import com.okane.reportmanagement.dto.ReportResponseDTO;
import com.okane.reportmanagement.dto.ReportSummaryDTO;
import com.okane.reportmanagement.dto.RevenueTrendPointDTO;
import com.okane.reportmanagement.dto.StatusDistributionDTO;
import com.okane.reportmanagement.dto.TrendPointDTO;
import com.okane.reportmanagement.exception.ReportExportException;
import com.okane.reportmanagement.exception.ReportNotFoundException;
import com.okane.reportmanagement.repository.GeneratedReportRepository;
import com.okane.reporting.entity.GeneratedReport;
import com.okane.transfer.repository.TransferRepository;
import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.ArrayList;
import java.util.Arrays;
import java.util.List;
import java.util.stream.Collectors;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class AdminReportService {

    private static final DateTimeFormatter DISPLAY_FMT = DateTimeFormatter.ofPattern("yyyy-MM-dd HH:mm");
    private static final DateTimeFormatter DATE_FMT = DateTimeFormatter.ofPattern("dd/MM/yyyy");

    private final GeneratedReportRepository reportRepository;
    private final TransferRepository transferRepository;
    private final ReportAuditService auditService;

    public AdminReportService(GeneratedReportRepository reportRepository,
                               TransferRepository transferRepository,
                               ReportAuditService auditService) {
        this.reportRepository = reportRepository;
        this.transferRepository = transferRepository;
        this.auditService = auditService;
    }

    // ─── Summary ────────────────────────────────────────────────────────────────

    @Transactional(readOnly = true)
    public ReportSummaryDTO getSummary() {
        LocalDateTime todayStart = LocalDate.now().atStartOfDay();
        LocalDateTime todayEnd = todayStart.plusDays(1);
        LocalDateTime monthStart = LocalDate.now().withDayOfMonth(1).atStartOfDay();

        long dailyVolume = transferRepository.countByCreatedAtBetween(todayStart, todayEnd);

        // Monthly volume: sum of amounts for current month
        // TODO: add a dedicated JPQL query when Transfer aggregation is needed.
        // For now we count transfers this month as a proxy.
        long monthlyCount = transferRepository.countByCreatedAtBetween(monthStart, todayEnd);
        BigDecimal monthlyVolume = BigDecimal.valueOf(monthlyCount);

        // Revenue = sum of feeAmount for current month (TODO: JPQL aggregation)
        BigDecimal revenue = BigDecimal.ZERO;

        // Commissions (TODO: aggregate from FeeGrid commission rules)
        BigDecimal totalCommissions = BigDecimal.ZERO;

        long paid = transferRepository.countByStatus("PAID");
        long total = transferRepository.count();
        long failed = transferRepository.countByStatus("CANCELLED")
                + transferRepository.countByStatus("EXPIRED");

        double failureRate = total == 0 ? 0.0
                : BigDecimal.valueOf(failed * 100.0 / total)
                        .setScale(2, RoundingMode.HALF_UP)
                        .doubleValue();

        return new ReportSummaryDTO(dailyVolume, monthlyVolume, revenue, totalCommissions, paid, failureRate);
    }

    // ─── Report list ────────────────────────────────────────────────────────────

    @Transactional(readOnly = true)
    public List<ReportResponseDTO> listReports() {
        return reportRepository.findAllByOrderByGeneratedAtDesc()
                .stream()
                .map(this::toDTO)
                .collect(Collectors.toList());
    }

    // ─── Report detail ──────────────────────────────────────────────────────────

    @Transactional(readOnly = true)
    public ReportResponseDTO getReport(Long id) {
        GeneratedReport report = reportRepository.findById(id)
                .orElseThrow(() -> new ReportNotFoundException(id));
        auditService.logReportViewed(id);
        return toDTO(report);
    }

    // ─── Analytics ──────────────────────────────────────────────────────────────

    @Transactional(readOnly = true)
    public ReportAnalyticsDTO getAnalytics() {
        ReportAnalyticsDTO analytics = new ReportAnalyticsDTO();

        // Transfer volume: last 7 days (count per day)
        analytics.setTransferVolume(buildVolumeTrend());

        // Revenue & commissions: last 5 months (placeholder — real aggregation needs JPQL)
        analytics.setRevenueCommissions(buildRevenueTrend());

        // Agency performance: top agencies by transfer count (TODO: real aggregation)
        analytics.setAgencyPerformance(new ArrayList<>());

        // Status distribution
        analytics.setStatusDistribution(buildStatusDistribution());

        return analytics;
    }

    // ─── Export ─────────────────────────────────────────────────────────────────

    @Transactional(readOnly = true)
    public ExportReportResponseDTO exportPdf(Long id) {
        GeneratedReport report = reportRepository.findById(id)
                .orElseThrow(() -> new ReportNotFoundException(id));
        if (ReportStatus.PREPARING.name().equals(report.getStatus())) {
            throw new ReportExportException("Le rapport est encore en cours de préparation.");
        }
        auditService.logReportExportedPdf(id);
        // TODO: generate real PDF when a PDF library is integrated.
        String fileName = "rapport-" + id + ".pdf";
        return new ExportReportResponseDTO(fileName, "application/pdf", null);
    }

    @Transactional(readOnly = true)
    public ExportReportResponseDTO exportCsv(Long id) {
        GeneratedReport report = reportRepository.findById(id)
                .orElseThrow(() -> new ReportNotFoundException(id));
        if (ReportStatus.PREPARING.name().equals(report.getStatus())) {
            throw new ReportExportException("Le rapport est encore en cours de préparation.");
        }
        auditService.logReportExportedCsv(id);
        // TODO: generate real CSV when export logic is implemented.
        String fileName = "rapport-" + id + ".csv";
        return new ExportReportResponseDTO(fileName, "text/csv", null);
    }

    // ─── Helpers ────────────────────────────────────────────────────────────────

    private ReportResponseDTO toDTO(GeneratedReport r) {
        ReportResponseDTO dto = new ReportResponseDTO();
        dto.setId(r.getId());
        dto.setStatus(parseStatus(r.getStatus()));
        dto.setType(parseType(r.getReportType()));
        dto.setPeriod(ReportPeriod.CUSTOM);

        // Build a human-readable name from type + period
        String typeName = r.getReportType() != null ? r.getReportType() : "Rapport";
        String periodStr = r.getPeriodStart() != null
                ? r.getPeriodStart().format(DATE_FMT) + " → " + r.getPeriodEnd().format(DATE_FMT)
                : "—";
        dto.setName(typeName + " — " + periodStr);
        dto.setPeriodRange(periodStr);

        if (r.getAgency() != null) {
            dto.setAgencyName(r.getAgency().getName());
            dto.setAgencyCode(r.getAgency().getCode());
            dto.setCountry(r.getAgency().getCountry());
        } else {
            dto.setCountry("Tous");
        }

        dto.setCurrency("MULTI");
        dto.setGeneratedAt(r.getGeneratedAt() != null ? r.getGeneratedAt().format(DISPLAY_FMT) : "—");
        dto.setGeneratedBy(r.getGeneratedBy() != null ? r.getGeneratedBy().getEmail() : "Système");

        return dto;
    }

    private ReportStatus parseStatus(String s) {
        if (s == null) return ReportStatus.PREPARING;
        try { return ReportStatus.valueOf(s); } catch (IllegalArgumentException e) { return ReportStatus.PREPARING; }
    }

    private ReportType parseType(String s) {
        if (s == null) return ReportType.FINANCIAL;
        try { return ReportType.valueOf(s); } catch (IllegalArgumentException e) { return ReportType.FINANCIAL; }
    }

    private List<TrendPointDTO> buildVolumeTrend() {
        String[] days = {"Lun", "Mar", "Mer", "Jeu", "Ven", "Sam", "Dim"};
        List<TrendPointDTO> result = new ArrayList<>();
        LocalDateTime now = LocalDateTime.now();
        for (int i = 6; i >= 0; i--) {
            LocalDateTime start = now.minusDays(i).toLocalDate().atStartOfDay();
            LocalDateTime end = start.plusDays(1);
            long count = transferRepository.countByCreatedAtBetween(start, end);
            result.add(new TrendPointDTO(days[(7 - i - 1) % 7], count));
        }
        return result;
    }

    private List<RevenueTrendPointDTO> buildRevenueTrend() {
        // TODO: replace with real JPQL aggregation once Transfer fee data is populated.
        String[] months = {"Jan", "Fév", "Mar", "Avr", "Mai"};
        List<RevenueTrendPointDTO> result = new ArrayList<>();
        for (String m : months) {
            result.add(new RevenueTrendPointDTO(m, 0, 0));
        }
        return result;
    }

    private List<StatusDistributionDTO> buildStatusDistribution() {
        long total = transferRepository.count();
        if (total == 0) {
            return Arrays.asList(
                    new StatusDistributionDTO("PAID", 0, 0),
                    new StatusDistributionDTO("PENDING", 0, 0),
                    new StatusDistributionDTO("CANCELLED", 0, 0),
                    new StatusDistributionDTO("EXPIRED", 0, 0)
            );
        }
        long paid = transferRepository.countByStatus("PAID");
        long pending = transferRepository.countByStatus("PENDING");
        long cancelled = transferRepository.countByStatus("CANCELLED");
        long expired = transferRepository.countByStatus("EXPIRED");

        return Arrays.asList(
                new StatusDistributionDTO("PAID", paid, pct(paid, total)),
                new StatusDistributionDTO("PENDING", pending, pct(pending, total)),
                new StatusDistributionDTO("CANCELLED", cancelled, pct(cancelled, total)),
                new StatusDistributionDTO("EXPIRED", expired, pct(expired, total))
        );
    }

    private double pct(long part, long total) {
        if (total == 0) return 0;
        return BigDecimal.valueOf(part * 100.0 / total)
                .setScale(1, RoundingMode.HALF_UP)
                .doubleValue();
    }
}
