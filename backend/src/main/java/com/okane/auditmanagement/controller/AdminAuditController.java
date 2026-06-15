package com.okane.auditmanagement.controller;

import com.okane.auditmanagement.dto.AuditLogResponseDTO;
import com.okane.auditmanagement.dto.AuditSummaryDTO;
import com.okane.auditmanagement.dto.ExportAuditResponseDTO;
import com.okane.auditmanagement.exception.AuditLogNotFoundException;
import com.okane.auditmanagement.service.AdminAuditService;
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
@RequestMapping("/api/admin/audit")
@PreAuthorize("hasRole('ADMIN')")
public class AdminAuditController {

    private final AdminAuditService auditService;

    public AdminAuditController(AdminAuditService auditService) {
        this.auditService = auditService;
    }

    /** KPI cards */
    @GetMapping("/summary")
    public ResponseEntity<AuditSummaryDTO> getSummary() {
        return ResponseEntity.ok(auditService.getSummary());
    }

    /** Table journal d'audit — read-only, no pagination for now */
    @GetMapping("/logs")
    public ResponseEntity<List<AuditLogResponseDTO>> listLogs() {
        return ResponseEntity.ok(auditService.listLogs());
    }

    /** Détails d'un log */
    @GetMapping("/logs/{id}")
    public ResponseEntity<?> getLog(@PathVariable Long id) {
        try {
            return ResponseEntity.ok(auditService.getLog(id));
        } catch (AuditLogNotFoundException e) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND)
                    .body(Map.of("message", e.getMessage()));
        }
    }

    /** Export placeholder — returns file metadata, no delete/update allowed */
    @GetMapping("/export")
    public ResponseEntity<ExportAuditResponseDTO> exportLogs() {
        return ResponseEntity.ok(auditService.exportLogs());
    }
}
