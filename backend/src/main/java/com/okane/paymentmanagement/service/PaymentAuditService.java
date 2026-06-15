package com.okane.paymentmanagement.service;

import com.okane.audit.entity.AuditLog;
import com.okane.auth.entity.User;
import com.okane.auth.repository.AuditLogRepository;
import com.okane.cash.entity.Payout;
import java.time.LocalDateTime;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

/**
 * Records sensitive payment operations in the existing audit journal. Mirrors
 * {@code AuthAuditService} / {@code TransferAuditService} so the journal stays
 * consistent across modules.
 */
@Service
public class PaymentAuditService {

    private static final String ENTITY_NAME = "Payment";

    private final AuditLogRepository auditLogRepository;

    public PaymentAuditService(AuditLogRepository auditLogRepository) {
        this.auditLogRepository = auditLogRepository;
    }

    @Transactional
    public void logPaymentViewed(User actor, Payout payout) {
        log(actor, "PAYMENT_VIEWED", payout, "Viewed payment " + safeReference(payout));
    }

    @Transactional
    public void logPaymentBlocked(User actor, Payout payout) {
        log(actor, "PAYMENT_BLOCKED", payout, "Blocked payment " + safeReference(payout));
    }

    @Transactional
    public void logPaymentReceiptViewed(User actor, Payout payout) {
        log(actor, "PAYMENT_RECEIPT_VIEWED", payout, "Receipt viewed for " + safeReference(payout));
    }

    private void log(User actor, String action, Payout payout, String description) {
        AuditLog auditLog = new AuditLog();
        auditLog.setUser(actor);
        auditLog.setUserRole(actor != null && actor.getRole() != null ? actor.getRole().getName() : null);
        auditLog.setAction(action);
        auditLog.setEntityName(ENTITY_NAME);
        auditLog.setEntityId(payout != null ? payout.getId() : null);
        auditLog.setDescription(description);
        auditLog.setCreatedAt(LocalDateTime.now());
        auditLogRepository.save(auditLog);
    }

    private String safeReference(Payout payout) {
        if (payout == null) return "<unknown>";
        if (payout.getTransfer() != null && payout.getTransfer().getReferenceCode() != null) {
            return "PMT-" + payout.getId() + " (" + payout.getTransfer().getReferenceCode() + ")";
        }
        return "PMT-" + payout.getId();
    }
}
