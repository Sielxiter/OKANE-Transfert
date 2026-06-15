package com.okane.managermodule.service;

import com.okane.agency.entity.Agency;
import com.okane.agency.repository.AgencyRepository;
import com.okane.agency.repository.AgencyUserRepository;
import com.okane.auth.entity.User;
import com.okane.compliancemanagement.repository.ComplianceAlertRepository;
import com.okane.managermodule.dto.ReportDto;
import com.okane.reporting.entity.GeneratedReport;
import com.okane.reportmanagement.repository.GeneratedReportRepository;
import com.okane.transfer.repository.TransferRepository;
import org.springframework.security.core.Authentication;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.ArrayList;
import java.util.List;

@Service
public class ManagerReportService {

    private final GeneratedReportRepository generatedReportRepository;
    private final ManagerScopeResolver scopeResolver;
    private final TransferRepository transferRepository;
    private final AgencyUserRepository agencyUserRepository;
    private final ComplianceAlertRepository complianceAlertRepository;
    private final AgencyRepository agencyRepository;

    public ManagerReportService(GeneratedReportRepository generatedReportRepository,
                                 ManagerScopeResolver scopeResolver,
                                 TransferRepository transferRepository,
                                 AgencyUserRepository agencyUserRepository,
                                 ComplianceAlertRepository complianceAlertRepository,
                                 AgencyRepository agencyRepository) {
        this.generatedReportRepository = generatedReportRepository;
        this.scopeResolver = scopeResolver;
        this.transferRepository = transferRepository;
        this.agencyUserRepository = agencyUserRepository;
        this.complianceAlertRepository = complianceAlertRepository;
        this.agencyRepository = agencyRepository;
    }

    @Transactional(readOnly = true)
    public List<ReportDto> getAvailableReports(Authentication authentication) {
        ManagerScope scope = scopeResolver.resolve(authentication.getName());
        String managerEmail = authentication.getName();

        // Get previously generated reports from DB
        List<GeneratedReport> history = generatedReportRepository.findAllByOrderByGeneratedAtDesc();

        List<ReportDto> result = new ArrayList<>();

        // Add report type templates (always available to generate)
        result.add(new ReportDto(null, "Rapport de performance agence", "PERFORMANCE", "DAILY", null, "PDF", "AVAILABLE", null, null, null));
        result.add(new ReportDto(null, "Rapport de commissions", "COMMISSION", "MONTHLY", null, "PDF", "AVAILABLE", null, null, null));
        result.add(new ReportDto(null, "Rapport de volume transferts", "VOLUME", "DAILY", null, "CSV", "AVAILABLE", null, null, null));
        result.add(new ReportDto(null, "Rapport de conformite", "COMPLIANCE", "WEEKLY", null, "PDF", "AVAILABLE", null, null, null));

        // Add generated report history
        for (GeneratedReport gr : history) {
            result.add(new ReportDto(
                    gr.getId(),
                    gr.getReportType(),
                    gr.getReportType(),
                    "DAILY", // period not stored in existing entity, default to DAILY
                    null,
                    gr.getFormat(),
                    gr.getStatus(),
                    gr.getFilePath(),
                    gr.getGeneratedAt(),
                    gr.getGeneratedBy() != null ? gr.getGeneratedBy().getEmail() : null
            ));
        }

        return result;
    }

    @Transactional
    public ReportDto generateReport(String type, Authentication authentication) {
        ManagerScope scope = scopeResolver.resolve(authentication.getName());
        String managerEmail = authentication.getName();

        String period = determinePeriod(type);
        String format = determineFormat(type);

        // Generate report metadata using existing entity
        GeneratedReport report = new GeneratedReport();
        report.setReportType(type);
        report.setFormat(format);
        report.setStatus("GENERATED");
        report.setGeneratedAt(LocalDateTime.now());
        // Note: generatedBy and agency are User/Agency entities - would need lookup
        // For now, leave them null; the frontend only needs the DTO
        generatedReportRepository.save(report);

        String name = buildReportName(type, period);

        return new ReportDto(
                report.getId(),
                name,
                type,
                period,
                null,
                format,
                "GENERATED",
                null,
                report.getGeneratedAt(),
                managerEmail
        );
    }

    private String determinePeriod(String type) {
        return switch (type) {
            case "PERFORMANCE" -> "DAILY";
            case "COMMISSION" -> "MONTHLY";
            case "VOLUME" -> "DAILY";
            case "COMPLIANCE" -> "WEEKLY";
            default -> "DAILY";
        };
    }

    private String determineFormat(String type) {
        return "VOLUME".equals(type) ? "CSV" : "PDF";
    }

    private String buildReportName(String type, String period) {
        String dateStr = LocalDate.now().format(DateTimeFormatter.ISO_LOCAL_DATE);
        return switch (type) {
            case "PERFORMANCE" -> "Rapport performance " + dateStr;
            case "COMMISSION" -> "Rapport commissions " + dateStr;
            case "VOLUME" -> "Rapport volume " + dateStr;
            case "COMPLIANCE" -> "Rapport conformite " + dateStr;
            default -> "Rapport " + type + " " + dateStr;
        };
    }
}
