package com.okane.agencymanagement.service;

import com.okane.agency.entity.Agency;
import com.okane.audit.entity.AuditLog;
import com.okane.auth.entity.User;
import com.okane.auth.repository.AuditLogRepository;
import java.time.LocalDateTime;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

/**
 * Records sensitive agency-management actions in the existing audit journal.
 * Mirrors the {@code AuthAuditService} / {@code UserManagementAuditService}
 * pattern.
 */
@Service
public class AgencyAuditService {

    private static final String ENTITY_NAME = "Agency";

    private final AuditLogRepository auditLogRepository;

    public AgencyAuditService(AuditLogRepository auditLogRepository) {
        this.auditLogRepository = auditLogRepository;
    }

    @Transactional
    public void logAgencyCreated(User actor, Agency agency) {
        log(actor, "AGENCY_CREATED", agency, "Created agency " + safeCode(agency));
    }

    @Transactional
    public void logAgencyUpdated(User actor, Agency agency) {
        log(actor, "AGENCY_UPDATED", agency, "Updated agency " + safeCode(agency));
    }

    @Transactional
    public void logAgencyStatusChanged(User actor, Agency agency, String newStatus) {
        log(actor, "AGENCY_STATUS_CHANGED", agency, "Status set to " + newStatus + " for " + safeCode(agency));
    }

    @Transactional
    public void logManagerAssigned(User actor, Agency agency, Long managerId) {
        log(actor, "AGENCY_MANAGER_ASSIGNED", agency,
                "Manager " + managerId + " assigned to " + safeCode(agency));
    }

    @Transactional
    public void logAgentAssigned(User actor, Agency agency, Long agentId) {
        log(actor, "AGENCY_AGENT_ASSIGNED", agency,
                "Agent " + agentId + " assigned to " + safeCode(agency));
    }

    @Transactional
    public void logAgentRemoved(User actor, Agency agency, Long agentId) {
        log(actor, "AGENCY_AGENT_REMOVED", agency,
                "Agent " + agentId + " removed from " + safeCode(agency));
    }

    @Transactional
    public void logAgencyDisabled(User actor, Agency agency) {
        log(actor, "AGENCY_DISABLED", agency, "Disabled agency " + safeCode(agency));
    }

    private void log(User actor, String action, Agency agency, String description) {
        AuditLog auditLog = new AuditLog();
        auditLog.setUser(actor);
        auditLog.setUserRole(actor != null && actor.getRole() != null ? actor.getRole().getName() : null);
        auditLog.setAction(action);
        auditLog.setEntityName(ENTITY_NAME);
        auditLog.setEntityId(agency != null ? agency.getId() : null);
        auditLog.setDescription(description);
        auditLog.setCreatedAt(LocalDateTime.now());
        auditLogRepository.save(auditLog);
    }

    private String safeCode(Agency agency) {
        return agency != null && agency.getCode() != null ? agency.getCode() : "<unknown>";
    }
}
