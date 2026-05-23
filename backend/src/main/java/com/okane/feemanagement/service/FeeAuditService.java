package com.okane.feemanagement.service;

import com.okane.audit.entity.AuditLog;
import com.okane.auth.entity.User;
import com.okane.auth.repository.AuditLogRepository;
import com.okane.feescommission.entity.FeeGrid;
import java.time.LocalDateTime;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class FeeAuditService {

    private static final String ENTITY_NAME = "FeeGrid";

    private final AuditLogRepository auditLogRepository;

    public FeeAuditService(AuditLogRepository auditLogRepository) {
        this.auditLogRepository = auditLogRepository;
    }

    @Transactional
    public void logFeeGridCreated(User actor, FeeGrid grid) {
        log(actor, "FEE_GRID_CREATED", grid, "Created fee grid " + safeName(grid));
    }

    @Transactional
    public void logFeeGridUpdated(User actor, FeeGrid grid) {
        log(actor, "FEE_GRID_UPDATED", grid, "Updated fee grid " + safeName(grid));
    }

    @Transactional
    public void logFeeGridStatusChanged(User actor, FeeGrid grid, String newStatus) {
        log(actor, "FEE_GRID_STATUS_CHANGED", grid,
                "Status set to " + newStatus + " for " + safeName(grid));
    }

    @Transactional
    public void logFeeGridDuplicated(User actor, FeeGrid source, FeeGrid copy) {
        log(actor, "FEE_GRID_DUPLICATED", copy,
                "Duplicated fee grid " + safeName(source) + " into " + safeName(copy));
    }

    @Transactional
    public void logFeeSimulated(User actor, String corridor, String currency) {
        AuditLog auditLog = new AuditLog();
        auditLog.setUser(actor);
        auditLog.setUserRole(actor != null && actor.getRole() != null ? actor.getRole().getName() : null);
        auditLog.setAction("FEE_SIMULATED");
        auditLog.setEntityName(ENTITY_NAME);
        auditLog.setDescription("Simulated fees for " + corridor + " (" + currency + ")");
        auditLog.setCreatedAt(LocalDateTime.now());
        auditLogRepository.save(auditLog);
    }

    private void log(User actor, String action, FeeGrid grid, String description) {
        AuditLog auditLog = new AuditLog();
        auditLog.setUser(actor);
        auditLog.setUserRole(actor != null && actor.getRole() != null ? actor.getRole().getName() : null);
        auditLog.setAction(action);
        auditLog.setEntityName(ENTITY_NAME);
        auditLog.setEntityId(grid != null ? grid.getId() : null);
        auditLog.setDescription(description);
        auditLog.setCreatedAt(LocalDateTime.now());
        auditLogRepository.save(auditLog);
    }

    private String safeName(FeeGrid grid) {
        if (grid == null) return "<unknown>";
        return grid.getName() != null ? grid.getName() : "#" + grid.getId();
    }
}
