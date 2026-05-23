package com.okane.dashboard.controller;

import com.okane.dashboard.dto.AdminDashboardResponseDTO;
import com.okane.dashboard.service.AdminDashboardService;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

/**
 * Single aggregation endpoint for the admin dashboard. The frontend fetches
 * this once instead of issuing several parallel calls.
 *
 * <p>Path-level protection is applied by {@code SecurityConfig}
 * ({@code /api/admin/** -> hasRole("ADMIN")}); the {@code @PreAuthorize}
 * annotation here adds a second guard at the method level so the contract is
 * explicit on the controller.
 */
@RestController
@RequestMapping("/api/admin/dashboard")
@PreAuthorize("hasRole('ADMIN')")
public class AdminDashboardController {

    private final AdminDashboardService adminDashboardService;

    public AdminDashboardController(AdminDashboardService adminDashboardService) {
        this.adminDashboardService = adminDashboardService;
    }

    @GetMapping
    public ResponseEntity<AdminDashboardResponseDTO> getDashboardSummary() {
        return ResponseEntity.ok(adminDashboardService.getDashboardSummary());
    }
}
