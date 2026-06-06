package com.okane.manager.controller;

import com.okane.manager.dto.ManagerDailyReportResponse;
import com.okane.manager.dto.ManagerRevenueReportResponse;
import com.okane.manager.service.ManagerReportService;
import java.time.LocalDate;
import java.time.format.DateTimeParseException;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/manager/reports")
public class ManagerReportController {

    private final ManagerReportService reportService;

    public ManagerReportController(ManagerReportService reportService) {
        this.reportService = reportService;
    }

    // GET /api/manager/reports/daily?date=2026-05-28
    @GetMapping("/daily")
    public ResponseEntity<ManagerDailyReportResponse> getDailyReport(
            @RequestParam(name = "date", required = false) String dateParam,
            Authentication authentication
    ) {
        LocalDate date = parseDate(dateParam, LocalDate.now());
        return ResponseEntity.ok(reportService.getDailyReport(authentication, date));
    }

    // GET /api/manager/reports/revenue?start=2026-05-01&end=2026-05-31
    @GetMapping("/revenue")
    public ResponseEntity<ManagerRevenueReportResponse> getRevenueReport(
            @RequestParam(name = "start", required = false) String startParam,
            @RequestParam(name = "end", required = false) String endParam,
            Authentication authentication
    ) {
        LocalDate now = LocalDate.now();
        LocalDate start = parseDate(startParam, now.withDayOfMonth(1));
        LocalDate end = parseDate(endParam, now);
        return ResponseEntity.ok(reportService.getRevenueReport(authentication, start, end));
    }

    private LocalDate parseDate(String value, LocalDate fallback) {
        if (value == null || value.isBlank()) return fallback;
        try {
            return LocalDate.parse(value);
        } catch (DateTimeParseException e) {
            return fallback;
        }
    }
}