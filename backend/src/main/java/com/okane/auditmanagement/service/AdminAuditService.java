package com.okane.auditmanagement.service;

import com.okane.audit.entity.AuditLog;
import com.okane.auditmanagement.domain.AuditLogStatus;
import com.okane.auditmanagement.domain.AuditModule;
import com.okane.auditmanagement.domain.AuditRiskLevel;
import com.okane.auditmanagement.dto.AuditLogResponseDTO;
import com.okane.auditmanagement.dto.AuditSummaryDTO;
import com.okane.auditmanagement.dto.ExportAuditResponseDTO;
import com.okane.auditmanagement.exception.AuditLogNotFoundException;
import com.okane.auth.repository.AuditLogRepository;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.Arrays;
import java.util.List;
import java.util.stream.Collectors;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class AdminAuditService {

    private static final DateTimeFormatter DISPLAY_FMT = DateTimeFormatter.ofPattern("yyyy-MM-dd HH:mm:ss");

    /** Entity names that map to sensitive modules. */
    private static final List<String> SENSITIVE_ENTITY_NAMES = Arrays.asList(
            "User", "Agency", "Currency", "ExchangeRate", "FeeGrid", "FeeBracket",
            "CommissionRule", "TariffLine", "GeneratedReport", "AuditLog"
    );

    private final AuditLogRepository auditLogRepository;

    public AdminAuditService(AuditLogRepository auditLogRepository) {
        this.auditLogRepository = auditLogRepository;
    }

    // ─── Summary ────────────────────────────────────────────────────────────────

    @Transactional(readOnly = true)
    public AuditSummaryDTO getSummary() {
        LocalDateTime todayStart = LocalDate.now().atStartOfDay();
        LocalDateTime todayEnd = todayStart.plusDays(1);

        long actionsToday = auditLogRepository.countByCreatedAtBetween(todayStart, todayEnd);
        long failedLogins = auditLogRepository.countByActionContainingIgnoreCase("LOGIN_FAILED")
                + auditLogRepository.countByActionContainingIgnoreCase("LOGIN_BLOCKED");
        long sensitiveChanges = auditLogRepository.countByEntityNameIn(SENSITIVE_ENTITY_NAMES);
        long securityAlerts = auditLogRepository.countByActionContainingIgnoreCase("BLOCKED")
                + auditLogRepository.countByActionContainingIgnoreCase("SUSPICIOUS")
                + auditLogRepository.countByActionContainingIgnoreCase("FAILED");
        long adminActions = auditLogRepository.countByUserRole("ROLE_ADMIN");
        long criticalLogs = auditLogRepository.countByActionContainingIgnoreCase("CRITICAL")
                + auditLogRepository.countByActionContainingIgnoreCase("SUSPICIOUS")
                + auditLogRepository.countByActionContainingIgnoreCase("BLOCKED");

        return new AuditSummaryDTO(actionsToday, failedLogins, sensitiveChanges,
                securityAlerts, adminActions, criticalLogs);
    }

    // ─── List ────────────────────────────────────────────────────────────────────

    @Transactional(readOnly = true)
    public List<AuditLogResponseDTO> listLogs() {
        return auditLogRepository.findAllByOrderByCreatedAtDesc()
                .stream()
                .map(this::toDTO)
                .collect(Collectors.toList());
    }

    // ─── Detail ──────────────────────────────────────────────────────────────────

    @Transactional(readOnly = true)
    public AuditLogResponseDTO getLog(Long id) {
        AuditLog log = auditLogRepository.findById(id)
                .orElseThrow(() -> new AuditLogNotFoundException(id));
        return toDTO(log);
    }

    // ─── Export ──────────────────────────────────────────────────────────────────

    @Transactional(readOnly = true)
    public ExportAuditResponseDTO exportLogs() {
        // TODO: generate real CSV/PDF when export library is integrated.
        String fileName = "audit-logs-" + LocalDate.now() + ".csv";
        return new ExportAuditResponseDTO(fileName, "text/csv");
    }

    // ─── Mapping ─────────────────────────────────────────────────────────────────

    private AuditLogResponseDTO toDTO(AuditLog log) {
        AuditLogResponseDTO dto = new AuditLogResponseDTO();
        dto.setId(log.getId());
        dto.setCreatedAt(log.getCreatedAt() != null
                ? log.getCreatedAt().format(DISPLAY_FMT) : "—");
        dto.setAction(log.getAction() != null ? log.getAction() : "—");
        dto.setIpAddress(log.getIpAddress() != null ? log.getIpAddress() : "—");
        dto.setDescription(sanitizeDescription(log.getDescription()));

        // Actor
        if (log.getUser() != null) {
            dto.setActorId(String.valueOf(log.getUser().getId()));
            dto.setActorName(buildActorName(log.getUser()));
            dto.setActorEmail(log.getUser().getEmail());
        } else {
            dto.setActorId("SYS");
            dto.setActorName("Système");
            dto.setActorEmail("system@okane.local");
        }
        dto.setActorRole(log.getUserRole() != null ? log.getUserRole() : "SYSTEM");

        // Target
        String target = buildTarget(log.getEntityName(), log.getEntityId());
        dto.setTarget(target);

        // Derived fields
        dto.setModule(deriveModule(log.getAction(), log.getEntityName()));
        dto.setStatus(deriveStatus(log.getAction()));
        dto.setRiskLevel(deriveRisk(log.getAction(), dto.getStatus()));

        return dto;
    }

    private String buildActorName(com.okane.auth.entity.User user) {
        String first = user.getFirstName() != null ? user.getFirstName() : "";
        String last = user.getLastName() != null ? user.getLastName() : "";
        String full = (first + " " + last).trim();
        return full.isEmpty() ? user.getEmail() : full;
    }

    private String buildTarget(String entityName, Long entityId) {
        if (entityName == null) return "—";
        if (entityId == null) return entityName;
        return entityName + " #" + entityId;
    }

    /**
     * Derive the UI module from the action string or entity name.
     * Priority: action prefix → entity name → SYSTEM.
     */
    private AuditModule deriveModule(String action, String entityName) {
        String a = action != null ? action.toUpperCase() : "";
        String e = entityName != null ? entityName.toUpperCase() : "";

        if (a.contains("LOGIN") || a.contains("LOGOUT") || a.contains("PASSWORD")
                || a.contains("TOKEN") || a.contains("OTP") || e.equals("REFRESHTOKEN")) {
            return AuditModule.AUTH;
        }
        if (a.contains("USER") || e.contains("USER") || e.contains("CLIENTPROFILE")
                || e.contains("EMPLOYEEPROFILE")) {
            return AuditModule.USERS;
        }
        if (a.contains("AGENCY") || e.contains("AGENCY")) {
            return AuditModule.AGENCIES;
        }
        if (a.contains("TRANSFER") || e.contains("TRANSFER")) {
            return AuditModule.TRANSFERS;
        }
        if (a.contains("PAYMENT") || a.contains("PAYOUT") || a.contains("CASH")
                || e.contains("PAYMENT") || e.contains("PAYOUT") || e.contains("CASH")) {
            return AuditModule.PAYMENTS;
        }
        if (a.contains("CURRENCY") || a.contains("FX_RATE") || a.contains("EXCHANGE")
                || e.contains("CURRENCY") || e.contains("EXCHANGERATE")) {
            return AuditModule.CURRENCY;
        }
        if (a.contains("FEE") || a.contains("COMMISSION") || e.contains("FEE")
                || e.contains("COMMISSION")) {
            return AuditModule.FEES;
        }
        if (a.contains("COMPLIANCE") || a.contains("KYC") || a.contains("AML")
                || a.contains("BLACKLIST") || e.contains("COMPLIANCE") || e.contains("KYC")) {
            return AuditModule.COMPLIANCE;
        }
        if (a.contains("REPORT") || e.contains("REPORT")) {
            return AuditModule.REPORTS;
        }
        if (a.contains("SETTINGS") || a.contains("CONFIG") || e.contains("SETTINGS")) {
            return AuditModule.SETTINGS;
        }
        return AuditModule.SYSTEM;
    }

    /**
     * Derive status from action name.
     * Actions ending in _FAILED or _FAILURE → FAILURE.
     * Actions containing BLOCKED → BLOCKED.
     * Everything else → SUCCESS.
     */
    private AuditLogStatus deriveStatus(String action) {
        if (action == null) return AuditLogStatus.SUCCESS;
        String a = action.toUpperCase();
        if (a.contains("BLOCKED") || a.contains("BLOCK")) return AuditLogStatus.BLOCKED;
        if (a.endsWith("_FAILED") || a.endsWith("_FAILURE") || a.contains("FAILED")) {
            return AuditLogStatus.FAILURE;
        }
        return AuditLogStatus.SUCCESS;
    }

    /**
     * Derive risk level from action and status.
     * CRITICAL: suspicious, blocked, critical keywords.
     * HIGH: sensitive changes (suspend, delete, reject, compliance).
     * MEDIUM: updates, password, fx rate.
     * LOW: everything else.
     */
    private AuditRiskLevel deriveRisk(String action, AuditLogStatus status) {
        if (action == null) return AuditRiskLevel.LOW;
        String a = action.toUpperCase();

        if (status == AuditLogStatus.BLOCKED
                || a.contains("SUSPICIOUS") || a.contains("CRITICAL")
                || a.contains("COMPLIANCE_ALERT") || a.contains("BLACKLIST")) {
            return AuditRiskLevel.CRITICAL;
        }
        if (a.contains("SUSPENDED") || a.contains("DELETED") || a.contains("REJECTED")
                || a.contains("KYC_REJECTED") || a.contains("AGENCY_SUSPENDED")
                || a.contains("USER_SUSPENDED") || status == AuditLogStatus.FAILURE) {
            return AuditRiskLevel.HIGH;
        }
        if (a.contains("UPDATED") || a.contains("MODIFIED") || a.contains("PASSWORD")
                || a.contains("FX_RATE") || a.contains("FEE_GRID") || a.contains("SETTINGS")) {
            return AuditRiskLevel.MEDIUM;
        }
        return AuditRiskLevel.LOW;
    }

    /**
     * Strip any sensitive data patterns from description before exposing via API.
     * Passwords, tokens, secrets must never appear in the response.
     */
    private String sanitizeDescription(String description) {
        if (description == null) return null;
        // Mask anything that looks like a token or password value
        return description
                .replaceAll("(?i)(password|token|secret|key)\\s*[=:]\\s*\\S+", "$1=[MASQUÉ]")
                .replaceAll("(?i)(mot.de.passe)\\s*[=:]\\s*\\S+", "$1=[MASQUÉ]");
    }
}
