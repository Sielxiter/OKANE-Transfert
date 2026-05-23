package com.okane.transfermanagement.service;

import com.okane.audit.entity.AuditLog;
import com.okane.auth.entity.User;
import com.okane.auth.repository.AuditLogRepository;
import com.okane.transfer.entity.Transfer;
import java.time.LocalDateTime;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

/**
 * Records sensitive transfer operations in the existing audit journal.
 * Mirrors the pattern used by {@code AuthAuditService}, {@code
 * UserManagementAuditService} and {@code AgencyAuditService}.
 */
@Service
public class TransferAuditService {

    private static final String ENTITY_NAME = "Transfer";

    private final AuditLogRepository auditLogRepository;

    public TransferAuditService(AuditLogRepository auditLogRepository) {
        this.auditLogRepository = auditLogRepository;
    }

    @Transactional
    public void logTransferViewed(User actor, Transfer transfer) {
        log(actor, "TRANSFER_VIEWED", transfer, "Viewed transfer " + safeReference(transfer));
    }

    @Transactional
    public void logTransferMarkedSuspect(User actor, Transfer transfer) {
        log(actor, "TRANSFER_MARKED_SUSPECT", transfer,
                "Marked transfer " + safeReference(transfer) + " as suspect");
    }

    @Transactional
    public void logTransferCancelled(User actor, Transfer transfer) {
        log(actor, "TRANSFER_CANCELLED", transfer,
                "Cancelled transfer " + safeReference(transfer));
    }

    private void log(User actor, String action, Transfer transfer, String description) {
        AuditLog auditLog = new AuditLog();
        auditLog.setUser(actor);
        auditLog.setUserRole(actor != null && actor.getRole() != null ? actor.getRole().getName() : null);
        auditLog.setAction(action);
        auditLog.setEntityName(ENTITY_NAME);
        auditLog.setEntityId(transfer != null ? transfer.getId() : null);
        auditLog.setDescription(description);
        auditLog.setCreatedAt(LocalDateTime.now());
        auditLogRepository.save(auditLog);
    }

    private String safeReference(Transfer transfer) {
        if (transfer == null) return "<unknown>";
        if (transfer.getReferenceCode() != null) return transfer.getReferenceCode();
        return "#" + transfer.getId();
    }
}
