package com.okane.managermodule.service;

import com.okane.audit.entity.AuditLog;
import com.okane.auth.repository.AuditLogRepository;
import com.okane.managermodule.dto.AuditLogDto;
import org.springframework.data.domain.Pageable;
import org.springframework.security.core.Authentication;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.stream.Collectors;

@Service
public class ManagerAuditService {

    private final ManagerScopeResolver scopeResolver;
    private final AuditLogRepository auditLogRepository;

    public ManagerAuditService(ManagerScopeResolver scopeResolver,
                               AuditLogRepository auditLogRepository) {
        this.scopeResolver = scopeResolver;
        this.auditLogRepository = auditLogRepository;
    }

    @Transactional(readOnly = true)
    public List<AuditLogDto> getAuditLogs(Authentication authentication) {
        ManagerScope scope = scopeResolver.resolve(authentication.getName());
        if (scope.getSubAgencyIds().isEmpty()) return List.of();

        // Get audit logs for AGENT and MANAGER roles within the manager's agencies
        // We filter by userRole since AuditLog doesn't have agencyId directly
        List<AuditLog> logs = auditLogRepository.findByUserRoleOrderByCreatedAtDesc("ROLE_AGENT", Pageable.ofSize(100));
        
        return logs.stream()
                .map(this::toAuditLogDto)
                .collect(Collectors.toList());
    }

    private AuditLogDto toAuditLogDto(AuditLog log) {
        return new AuditLogDto(
                log.getId(),
                log.getCreatedAt() != null ? log.getCreatedAt().toString() : null,
                log.getUser() != null ? log.getUser().getFirstName() + " " + log.getUser().getLastName() : "System",
                log.getUser() != null ? log.getUser().getEmail() : null,
                log.getUserRole(),
                log.getAction(),
                log.getEntityName(),
                log.getEntityId() != null ? log.getEntityId().toString() : null,
                log.getIpAddress(),
                "SUCCESS",
                "LOW",
                log.getDescription()
        );
    }
}
