package com.okane.currencymanagement.service;

import com.okane.audit.entity.AuditLog;
import com.okane.auth.entity.User;
import com.okane.auth.repository.AuditLogRepository;
import com.okane.currencyfx.entity.Currency;
import java.time.LocalDateTime;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class CurrencyAuditService {

    private static final String CURRENCY_ENTITY = "Currency";
    private static final String CORRIDOR_ENTITY = "Corridor";
    private static final String FX_HISTORY_ENTITY = "ExchangeRate";

    private final AuditLogRepository auditLogRepository;

    public CurrencyAuditService(AuditLogRepository auditLogRepository) {
        this.auditLogRepository = auditLogRepository;
    }

    @Transactional
    public void logCurrencyCreated(User actor, Currency currency) {
        log(actor, "CURRENCY_CREATED", CURRENCY_ENTITY,
                currency != null ? currency.getId() : null,
                "Created currency " + safeCode(currency));
    }

    @Transactional
    public void logCurrencyStatusChanged(User actor, Currency currency, String newStatus) {
        log(actor, "CURRENCY_STATUS_CHANGED", CURRENCY_ENTITY,
                currency != null ? currency.getId() : null,
                "Status set to " + newStatus + " for " + safeCode(currency));
    }

    @Transactional
    public void logFxRateViewed(User actor) {
        log(actor, "FX_RATE_VIEWED", FX_HISTORY_ENTITY, null, "Viewed FX rates list");
    }

    @Transactional
    public void logCorridorViewed(User actor, Long corridorId) {
        log(actor, "CORRIDOR_VIEWED", CORRIDOR_ENTITY, corridorId,
                corridorId != null ? "Viewed corridor #" + corridorId : "Viewed corridors list");
    }

    @Transactional
    public void logFxHistoryViewed(User actor) {
        log(actor, "FX_HISTORY_VIEWED", FX_HISTORY_ENTITY, null, "Viewed FX history list");
    }

    @Transactional
    public void logCurrencyHistoryViewed(User actor, Currency currency) {
        log(actor, "FX_HISTORY_VIEWED", FX_HISTORY_ENTITY,
                currency != null ? currency.getId() : null,
                "Viewed history for " + safeCode(currency));
    }

    private void log(User actor, String action, String entityName, Long entityId, String description) {
        AuditLog auditLog = new AuditLog();
        auditLog.setUser(actor);
        auditLog.setUserRole(actor != null && actor.getRole() != null ? actor.getRole().getName() : null);
        auditLog.setAction(action);
        auditLog.setEntityName(entityName);
        auditLog.setEntityId(entityId);
        auditLog.setDescription(description);
        auditLog.setCreatedAt(LocalDateTime.now());
        auditLogRepository.save(auditLog);
    }

    private String safeCode(Currency currency) {
        if (currency == null) {
            return "<unknown>";
        }
        if (currency.getSymbol() != null && !currency.getSymbol().isBlank()) {
            return currency.getSymbol();
        }
        return currency.getName() != null ? currency.getName() : "<unknown>";
    }
}
