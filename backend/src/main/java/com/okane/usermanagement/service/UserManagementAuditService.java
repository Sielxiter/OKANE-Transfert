package com.okane.usermanagement.service;

import com.okane.audit.entity.AuditLog;
import com.okane.auth.entity.User;
import com.okane.auth.repository.AuditLogRepository;
import java.time.LocalDateTime;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

/**
 * Records sensitive user-management actions in the existing audit journal.
 * Mirrors the pattern used by {@code AuthAuditService} to keep audit logging
 * consistent across modules.
 */
@Service
public class UserManagementAuditService {

    private static final String ENTITY_NAME = "User";

    private final AuditLogRepository auditLogRepository;

    public UserManagementAuditService(AuditLogRepository auditLogRepository) {
        this.auditLogRepository = auditLogRepository;
    }

    @Transactional
    public void logUserCreated(User actor, User target) {
        log(actor, "USER_CREATED", target, "Created user " + safeEmail(target));
    }

    @Transactional
    public void logUserUpdated(User actor, User target) {
        log(actor, "USER_UPDATED", target, "Updated user " + safeEmail(target));
    }

    @Transactional
    public void logUserStatusChanged(User actor, User target, String newStatus) {
        log(actor, "USER_STATUS_CHANGED", target, "Status set to " + newStatus + " for " + safeEmail(target));
    }

    @Transactional
    public void logUserDisabled(User actor, User target) {
        log(actor, "USER_DISABLED", target, "Disabled user " + safeEmail(target));
    }

    private void log(User actor, String action, User target, String description) {
        AuditLog auditLog = new AuditLog();
        auditLog.setUser(actor);
        auditLog.setUserRole(actor != null && actor.getRole() != null ? actor.getRole().getName() : null);
        auditLog.setAction(action);
        auditLog.setEntityName(ENTITY_NAME);
        auditLog.setEntityId(target != null ? target.getId() : null);
        auditLog.setDescription(description);
        auditLog.setCreatedAt(LocalDateTime.now());
        auditLogRepository.save(auditLog);
    }

    private String safeEmail(User user) {
        return user != null && user.getEmail() != null ? user.getEmail() : "<unknown>";
    }
}
