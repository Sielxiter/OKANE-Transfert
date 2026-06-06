package com.okane.manager.controller;

import com.okane.manager.dto.*;
import com.okane.manager.service.ManagerCashManagementService;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.util.List;

@RestController
@RequestMapping("/api/manager/cash")
public class ManagerCashManagementController {

    private final ManagerCashManagementService cashService;

    public ManagerCashManagementController(ManagerCashManagementService cashService) {
        this.cashService = cashService;
    }

    // ==================== DASHBOARD ====================

    @GetMapping("/dashboard")
    public ResponseEntity<ManagerCashSummaryDTO> getDashboard(Authentication authentication) {
        return ResponseEntity.ok(cashService.getDashboardSummary(authentication));
    }

    // ==================== SESSIONS ====================

    @GetMapping("/sessions")
    public ResponseEntity<List<ManagerCashSessionDTO>> getSessions(
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate startDate,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate endDate,
            Authentication authentication
    ) {
        if (startDate == null) startDate = LocalDate.now().minusDays(30);
        if (endDate == null) endDate = LocalDate.now();
        return ResponseEntity.ok(cashService.getSessions(authentication, startDate, endDate));
    }

    @GetMapping("/sessions/{sessionId}")
    public ResponseEntity<ManagerCashSessionDTO> getSessionDetails(
            @PathVariable Long sessionId,
            Authentication authentication
    ) {
        return ResponseEntity.ok(cashService.getSessionDetails(authentication, sessionId));
    }

    // ==================== MOUVEMENTS ====================

    @GetMapping("/movements/{movementId}/details")
    public ResponseEntity<ManagerCashMovementDetailDTO> getMovementDetails(
            @PathVariable Long movementId,
            Authentication authentication
    ) {
        return ResponseEntity.ok(cashService.getMovementDetails(authentication, movementId));
    }

    // ==================== CLÔTURES ====================

    @GetMapping("/closures")
    public ResponseEntity<List<ManagerCashClosureDTO>> getClosures(
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate startDate,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate endDate,
            Authentication authentication
    ) {
        if (startDate == null) startDate = LocalDate.now().minusDays(30);
        if (endDate == null) endDate = LocalDate.now();
        return ResponseEntity.ok(cashService.getClosures(authentication, startDate, endDate));
    }

    @GetMapping("/closures/{sessionId}")
    public ResponseEntity<ManagerCashClosureDTO> getClosureDetails(
            @PathVariable Long sessionId,
            Authentication authentication
    ) {
        return ResponseEntity.ok(cashService.getClosureDetails(authentication, sessionId));
    }

    // ==================== ÉCARTS ====================

    @GetMapping("/discrepancies")
    public ResponseEntity<List<ManagerCashDiscrepancyDTO>> getDiscrepancies(
            @RequestParam(required = false) String status,
            Authentication authentication
    ) {
        return ResponseEntity.ok(cashService.getDiscrepancies(authentication, status));
    }

    @PatchMapping("/discrepancies/{discrepancyId}/resolve")
    public ResponseEntity<ManagerCashDiscrepancyDTO> resolveDiscrepancy(
            @PathVariable Long discrepancyId,
            Authentication authentication
    ) {
        return ResponseEntity.ok(cashService.resolveDiscrepancy(authentication, discrepancyId));
    }

    @GetMapping("/sessions/{sessionId}/movements")
    public ResponseEntity<List<ManagerCashMovementDetailDTO>> getSessionMovements(
            @PathVariable Long sessionId,
            Authentication authentication
    ) {
        return ResponseEntity.ok(cashService.getSessionMovements(authentication, sessionId));
    }
}
