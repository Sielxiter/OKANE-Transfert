package com.okane.managermodule.controller;

import com.okane.managermodule.dto.AlertListDto;
import com.okane.managermodule.service.ManagerAlertService;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@Validated
@RequestMapping("/api/manager/alerts")
@PreAuthorize("hasAnyRole('ADMIN', 'MANAGER')")
public class ManagerAlertController {

    private final ManagerAlertService managerAlertService;

    public ManagerAlertController(ManagerAlertService managerAlertService) {
        this.managerAlertService = managerAlertService;
    }

    @GetMapping("/unresolved-count")
    public ResponseEntity<Long> getUnresolvedCount(Authentication authentication) {
        return ResponseEntity.ok(managerAlertService.getUnresolvedCount(authentication));
    }

    @GetMapping
    public ResponseEntity<List<AlertListDto>> getAlerts(Authentication authentication) {
        return ResponseEntity.ok(managerAlertService.getAlerts(authentication));
    }

    @PostMapping("/{id}/resolve")
    public ResponseEntity<Void> resolveAlert(@PathVariable Long id, Authentication authentication) {
        managerAlertService.resolveAlert(id, authentication);
        return ResponseEntity.ok().build();
    }
}
