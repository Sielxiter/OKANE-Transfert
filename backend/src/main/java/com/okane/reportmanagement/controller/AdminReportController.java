package com.okane.reportmanagement.controller;

import com.okane.reportmanagement.dto.ExportReportResponseDTO;
import com.okane.reportmanagement.dto.ReportAnalyticsDTO;
import com.okane.reportmanagement.dto.ReportResponseDTO;
import com.okane.reportmanagement.dto.ReportSummaryDTO;
import com.okane.reportmanagement.exception.ReportExportException;
import com.okane.reportmanagement.exception.ReportNotFoundException;
import com.okane.reportmanagement.service.AdminReportService;
import java.util.List;
import java.util.Map;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/admin/reports")
@PreAuthorize("hasRole('ADMIN')")
public class AdminReportController {

    private final AdminReportService reportService;

    public AdminReportController(AdminReportService reportService) {
        this.reportService = reportService;
    }

    /** KPI cards */
    @GetMapping("/summary")
    public ResponseEntity<ReportSummaryDTO> getSummary() {
        return ResponseEntity.ok(reportService.getSummary());
    }

    /** Table catalogue des rapports */
    @GetMapping
    public ResponseEntity<List<ReportResponseDTO>> listReports() {
        return ResponseEntity.ok(reportService.listReports());
    }

    /** Analytics sections (volume, revenue, agency performance, status distribution) */
    @GetMapping("/analytics")
    public ResponseEntity<ReportAnalyticsDTO> getAnalytics() {
        return ResponseEntity.ok(reportService.getAnalytics());
    }

    /** Détails d'un rapport */
    @GetMapping("/{id}")
    public ResponseEntity<?> getReport(@PathVariable Long id) {
        try {
            return ResponseEntity.ok(reportService.getReport(id));
        } catch (ReportNotFoundException e) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND)
                    .body(Map.of("message", e.getMessage()));
        }
    }

    /** Export PDF */
    @GetMapping("/{id}/export/pdf")
    public ResponseEntity<?> exportPdf(@PathVariable Long id) {
        try {
            ExportReportResponseDTO result = reportService.exportPdf(id);
            return ResponseEntity.ok(result);
        } catch (ReportNotFoundException e) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND)
                    .body(Map.of("message", e.getMessage()));
        } catch (ReportExportException e) {
            return ResponseEntity.status(HttpStatus.CONFLICT)
                    .body(Map.of("message", e.getMessage()));
        }
    }

    /** Export CSV */
    @GetMapping("/{id}/export/csv")
    public ResponseEntity<?> exportCsv(@PathVariable Long id) {
        try {
            ExportReportResponseDTO result = reportService.exportCsv(id);
            return ResponseEntity.ok(result);
        } catch (ReportNotFoundException e) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND)
                    .body(Map.of("message", e.getMessage()));
        } catch (ReportExportException e) {
            return ResponseEntity.status(HttpStatus.CONFLICT)
                    .body(Map.of("message", e.getMessage()));
        }
    }
}
