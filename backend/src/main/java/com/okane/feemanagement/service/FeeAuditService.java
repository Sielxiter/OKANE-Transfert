package com.okane.feemanagement.service;

import com.okane.audit.entity.AuditLog;
import com.okane.auth.entity.User;
import com.okane.auth.repository.AuditLogRepository;
import com.okane.feescommission.entity.TariffLine;
import java.time.LocalDateTime;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class FeeAuditService {

    private static final String ENTITY_NAME = "TariffLine";

    private final AuditLogRepository auditLogRepository;

    public FeeAuditService(AuditLogRepository auditLogRepository) {
        this.auditLogRepository = auditLogRepository;
    }

    @Transactional
    public void logTariffLineCreated(User actor, TariffLine line) {
        log(actor, "TARIFF_LINE_CREATED", line, "Created tariff line " + safeName(line));
    }

    @Transactional
    public void logTariffLineUpdated(User actor, TariffLine line) {
        log(actor, "TARIFF_LINE_UPDATED", line, "Updated tariff line " + safeName(line));
    }

    @Transactional
    public void logTariffLineDeleted(User actor, TariffLine line) {
        log(actor, "TARIFF_LINE_DELETED", line, "Deleted tariff line " + safeName(line));
    }

    @Transactional
    public void logTariffSimulated(User actor, String corridorLabel, String amountLabel) {
        AuditLog auditLog = new AuditLog();
        auditLog.setUser(actor);
        auditLog.setUserRole(actor != null && actor.getRole() != null ? actor.getRole().getName() : null);
        auditLog.setAction("TARIFF_SIMULATED");
        auditLog.setEntityName(ENTITY_NAME);
        auditLog.setDescription("Simulated tariff for " + corridorLabel + " (" + amountLabel + ")");
        auditLog.setCreatedAt(LocalDateTime.now());
        auditLogRepository.save(auditLog);
    }

    private void log(User actor, String action, TariffLine line, String description) {
        AuditLog auditLog = new AuditLog();
        auditLog.setUser(actor);
        auditLog.setUserRole(actor != null && actor.getRole() != null ? actor.getRole().getName() : null);
        auditLog.setAction(action);
        auditLog.setEntityName(ENTITY_NAME);
        auditLog.setEntityId(line != null ? line.getId() : null);
        auditLog.setDescription(description);
        auditLog.setCreatedAt(LocalDateTime.now());
        auditLogRepository.save(auditLog);
    }

    private String safeName(TariffLine line) {
        if (line == null) return "<unknown>";
        return line.getId() != null ? "#" + line.getId() : "<new>";
    }
}
