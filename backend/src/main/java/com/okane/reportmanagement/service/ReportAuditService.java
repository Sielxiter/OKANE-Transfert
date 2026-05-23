package com.okane.reportmanagement.service;

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
public class ReportAuditService {

    @PersistenceContext
    private EntityManager entityManager;

    @Transactional(propagation = Propagation.REQUIRES_NEW)
    public void logReportViewed(Long reportId) {
        save("REPORT_VIEWED", "GeneratedReport", reportId, "Rapport consulté");
    }

    @Transactional(propagation = Propagation.REQUIRES_NEW)
    public void logReportExportedPdf(Long reportId) {
        save("REPORT_EXPORTED_PDF", "GeneratedReport", reportId, "Export PDF demandé");
    }

    @Transactional(propagation = Propagation.REQUIRES_NEW)
    public void logReportExportedCsv(Long reportId) {
        save("REPORT_EXPORTED_CSV", "GeneratedReport", reportId, "Export CSV demandé");
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
