package com.okane.managermodule.controller;

import com.okane.managermodule.dto.AuditLogDto;
import com.okane.managermodule.service.ManagerAuditService;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@Validated
@RequestMapping("/api/manager/audit-log")
@PreAuthorize("hasAnyRole('ADMIN', 'MANAGER')")
public class ManagerAuditController {

    private final ManagerAuditService managerAuditService;

    public ManagerAuditController(ManagerAuditService managerAuditService) {
        this.managerAuditService = managerAuditService;
    }

    @GetMapping
    public ResponseEntity<List<AuditLogDto>> getAuditLogs(Authentication authentication) {
        return ResponseEntity.ok(managerAuditService.getAuditLogs(authentication));
    }
}
