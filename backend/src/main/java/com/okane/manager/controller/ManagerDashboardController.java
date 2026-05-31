package com.okane.manager.controller;

import com.okane.manager.dto.ManagerDashboardDTO;
import com.okane.manager.service.ManagerDashboardService;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/manager/dashboard")
public class ManagerDashboardController {

    private final ManagerDashboardService dashboardService;

    public ManagerDashboardController(ManagerDashboardService dashboardService) {
        this.dashboardService = dashboardService;
    }

    @GetMapping
    public ResponseEntity<ManagerDashboardDTO> getDashboard(Authentication authentication) {
        return ResponseEntity.ok(dashboardService.getDashboard(authentication));
    }
}