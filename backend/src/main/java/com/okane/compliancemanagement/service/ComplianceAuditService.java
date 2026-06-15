package com.okane.compliancemanagement.service;

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
public class ComplianceAuditService {

    @PersistenceContext
    private EntityManager entityManager;

    @Transactional(propagation = Propagation.REQUIRES_NEW)
    public void logKycVerified(Long kycId) {
        save("KYC_VERIFIED", "KycCheck", kycId, "Dossier KYC vérifié");
    }

    @Transactional(propagation = Propagation.REQUIRES_NEW)
    public void logKycRejected(Long kycId, String reason) {
        save("KYC_REJECTED", "KycCheck", kycId, "Dossier KYC rejeté : " + reason);
    }

    @Transactional(propagation = Propagation.REQUIRES_NEW)
    public void logKycMarkedReview(Long kycId) {
        save("KYC_MARKED_REVIEW", "KycCheck", kycId, "Dossier KYC marqué pour révision");
    }

    @Transactional(propagation = Propagation.REQUIRES_NEW)
    public void logAmlStatusChanged(Long alertId, String newStatus) {
        save("AML_ALERT_STATUS_CHANGED", "SuspiciousReport", alertId,
                "Statut alerte AML → " + newStatus);
    }

    @Transactional(propagation = Propagation.REQUIRES_NEW)
    public void logBlacklistViewed() {
        save("BLACKLIST_VIEWED", "WatchlistEntry", null, "Blacklist consultée");
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
