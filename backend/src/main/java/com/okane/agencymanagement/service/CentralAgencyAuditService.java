package com.okane.agencymanagement.service;

import com.okane.audit.entity.AuditLog;
import com.okane.auth.entity.User;
import com.okane.auth.repository.AuditLogRepository;
import com.okane.centralagency.entity.CentralAgency;
import java.time.LocalDateTime;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class CentralAgencyAuditService {

    private static final String ENTITY_NAME = "CentralAgency";

    private final AuditLogRepository auditLogRepository;

    public CentralAgencyAuditService(AuditLogRepository auditLogRepository) {
        this.auditLogRepository = auditLogRepository;
    }

    @Transactional
    public void logAgencyCreated(User actor, CentralAgency agency) {
        log(actor, "CENTRAL_AGENCY_CREATED", agency, "Created central agency " + safeCode(agency));
    }

    @Transactional
    public void logAgencyUpdated(User actor, CentralAgency agency) {
        log(actor, "CENTRAL_AGENCY_UPDATED", agency, "Updated central agency " + safeCode(agency));
    }

    @Transactional
    public void logAgencyStatusChanged(User actor, CentralAgency agency, String newStatus) {
        log(actor, "CENTRAL_AGENCY_STATUS_CHANGED", agency, "Status set to " + newStatus + " for " + safeCode(agency));
    }

    @Transactional
    public void logManagerAssigned(User actor, CentralAgency agency, Long managerId) {
        log(actor, "CENTRAL_AGENCY_MANAGER_ASSIGNED", agency,
                "Manager " + managerId + " assigned to " + safeCode(agency));
    }

    @Transactional
    public void logAgencyDisabled(User actor, CentralAgency agency) {
        log(actor, "CENTRAL_AGENCY_DISABLED", agency, "Disabled central agency " + safeCode(agency));
    }

    private void log(User actor, String action, CentralAgency agency, String description) {
        AuditLog auditLog = new AuditLog();
        auditLog.setUser(actor);
        String role = null;
        try {
            role = actor != null && actor.getRole() != null ? actor.getRole().getName() : null;
        } catch (RuntimeException ignored) {
        }
        auditLog.setUserRole(role);
        auditLog.setAction(action);
        auditLog.setEntityName(ENTITY_NAME);
        auditLog.setEntityId(agency != null ? agency.getId() : null);
        auditLog.setDescription(description);
        auditLog.setCreatedAt(LocalDateTime.now());
        auditLogRepository.save(auditLog);
    }

    private String safeCode(CentralAgency agency) {
        return agency != null && agency.getCode() != null ? agency.getCode() : "<unknown>";
    }
}
