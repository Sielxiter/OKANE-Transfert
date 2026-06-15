package com.okane.managermodule.controller;

import com.okane.managermodule.dto.DashboardOverviewDto;
import com.okane.managermodule.service.ManagerDashboardService;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@Validated
@RequestMapping("/api/manager/dashboard")
@PreAuthorize("hasAnyRole('ADMIN', 'MANAGER')")
public class ManagerDashboardController {

    private final ManagerDashboardService managerDashboardService;

    public ManagerDashboardController(ManagerDashboardService managerDashboardService) {
        this.managerDashboardService = managerDashboardService;
    }

    @GetMapping("/overview")
    public ResponseEntity<DashboardOverviewDto> getOverview(Authentication authentication) {
        return ResponseEntity.ok(managerDashboardService.getOverview(authentication));
    }
}
