package com.okane.managermodule.controller;

import com.okane.managermodule.dto.ReportDto;
import com.okane.managermodule.service.ManagerReportService;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@Validated
@RequestMapping("/api/manager/reports")
@PreAuthorize("hasAnyRole('ADMIN', 'MANAGER')")
public class ManagerReportController {

    private final ManagerReportService managerReportService;

    public ManagerReportController(ManagerReportService managerReportService) {
        this.managerReportService = managerReportService;
    }

    @GetMapping
    public ResponseEntity<List<ReportDto>> getAvailableReports(Authentication authentication) {
        return ResponseEntity.ok(managerReportService.getAvailableReports(authentication));
    }

    @GetMapping("/{type}")
    public ResponseEntity<ReportDto> generateReport(@PathVariable String type, Authentication authentication) {
        return ResponseEntity.ok(managerReportService.generateReport(type, authentication));
    }
}
