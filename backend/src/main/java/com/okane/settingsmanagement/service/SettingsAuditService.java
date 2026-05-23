package com.okane.settingsmanagement.service;

import com.okane.audit.entity.AuditLog;
import jakarta.persistence.EntityManager;
import jakarta.persistence.PersistenceContext;
import java.time.LocalDateTime;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Propagation;
import org.springframework.transaction.annotation.Transactional;

@Service
public class SettingsAuditService {

    @PersistenceContext
    private EntityManager entityManager;

    @Transactional(propagation = Propagation.REQUIRES_NEW)
    public void logProfileUpdated(Long userId) {
        save("ADMIN_PROFILE_UPDATED", "User", userId, "Profil administrateur mis à jour");
    }

    @Transactional(propagation = Propagation.REQUIRES_NEW)
    public void logSecurityUpdated(Long userId) {
        save("SECURITY_SETTINGS_UPDATED", "User", userId, "Paramètres de sécurité mis à jour");
    }

    @Transactional(propagation = Propagation.REQUIRES_NEW)
    public void logNotificationsUpdated(Long userId) {
        save("NOTIFICATION_SETTINGS_UPDATED", "UserPreference", userId, "Paramètres de notifications mis à jour");
    }

    @Transactional(propagation = Propagation.REQUIRES_NEW)
    public void logPreferencesUpdated(Long userId) {
        save("PREFERENCES_UPDATED", "UserPreference", userId, "Préférences utilisateur mises à jour");
    }

    @Transactional(propagation = Propagation.REQUIRES_NEW)
    public void logSystemSettingsUpdated() {
        save("SYSTEM_SETTINGS_UPDATED", "SystemSetting", null, "Paramètres système mis à jour");
    }

    private void save(String action, String entityName, Long entityId, String description) {
        AuditLog log = new AuditLog();
        log.setAction(action);
        log.setEntityName(entityName);
        log.setEntityId(entityId);
        log.setDescription(description);
        log.setUserRole(currentRole());
        log.setCreatedAt(LocalDateTime.now());
        entityManager.persist(log);
    }

    private String currentRole() {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        if (auth == null || auth.getAuthorities() == null) return "UNKNOWN";
        return auth.getAuthorities().stream()
                .findFirst()
                .map(a -> a.getAuthority())
                .orElse("UNKNOWN");
    }
}
