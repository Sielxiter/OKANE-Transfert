package com.okane.dashboard.service;

import com.okane.agency.repository.AgencyRepository;
import com.okane.agencymanagement.domain.AgencyStatus;
import com.okane.audit.entity.AuditLog;
import com.okane.auth.entity.User;
import com.okane.auth.repository.AuditLogRepository;
import com.okane.auth.repository.UserRepository;
import com.okane.centralagency.entity.CentralAgency;
import com.okane.centralagency.repository.CentralAgencyRepository;
import com.okane.dashboard.dto.AdminDashboardResponseDTO;
import com.okane.dashboard.dto.DashboardAnalyticsDTO;
import com.okane.dashboard.dto.DashboardKpiDTO;
import com.okane.dashboard.dto.RecentActivityDTO;
import com.okane.dashboard.dto.SystemAlertDTO;
import com.okane.dashboard.dto.TrendPointDTO;
import com.okane.transfer.entity.Transfer;
import com.okane.transfer.repository.TransferRepository;
import com.okane.cash.repository.PayoutRepository;
import com.okane.paymentmanagement.domain.PaymentStatus;
import com.okane.transfermanagement.domain.TransferStatus;
import jakarta.persistence.criteria.Predicate;
import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;
import java.time.YearMonth;
import java.time.format.TextStyle;
import java.util.ArrayList;
import java.util.List;
import java.util.Locale;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

/**
 * Aggregates dashboard data for the admin home screen.
 *
 * <p>This service is deliberately resilient: when downstream modules
 * (Payments, Compliance, Reporting) are not implemented yet, the corresponding
 * KPIs and analytics fall back to {@code 0} or empty lists. Real values are
 * wired in as the matching modules are built, without breaking the JSON
 * contract consumed by the frontend.
 */
@Service
public class AdminDashboardService {

    private static final int RECENT_ACTIVITIES_LIMIT = 8;
    private static final int USER_GROWTH_DAYS = 7;
    private static final int TRANSFER_TREND_DAYS = 7;
    private static final Locale FRENCH = Locale.FRENCH;

    private final UserRepository userRepository;
    private final AgencyRepository agencyRepository;
    private final CentralAgencyRepository centralAgencyRepository;
    private final AuditLogRepository auditLogRepository;
    private final TransferRepository transferRepository;
    private final PayoutRepository payoutRepository;

    public AdminDashboardService(
            UserRepository userRepository,
            AgencyRepository agencyRepository,
            CentralAgencyRepository centralAgencyRepository,
            AuditLogRepository auditLogRepository,
            TransferRepository transferRepository,
            PayoutRepository payoutRepository
    ) {
        this.userRepository = userRepository;
        this.agencyRepository = agencyRepository;
        this.centralAgencyRepository = centralAgencyRepository;
        this.auditLogRepository = auditLogRepository;
        this.transferRepository = transferRepository;
        this.payoutRepository = payoutRepository;
    }

    @Transactional(readOnly = true)
    public AdminDashboardResponseDTO getDashboardSummary() {
        DashboardKpiDTO kpis = buildKpis();
        List<RecentActivityDTO> recentActivities = loadRecentActivities();
        List<SystemAlertDTO> systemAlerts = buildSystemAlerts(kpis);
        DashboardAnalyticsDTO analytics = buildAnalytics();
        return new AdminDashboardResponseDTO(kpis, recentActivities, systemAlerts, analytics);
    }

    private DashboardKpiDTO buildKpis() {
        long totalUsers = userRepository.count();
        long totalClients = userRepository.countByRole_Name("ROLE_CLIENT");
        long totalAdmins = userRepository.countByRole_Name("ROLE_ADMIN");
        long totalManagers = userRepository.countByRole_Name("ROLE_MANAGER");
        long totalAgents = userRepository.countByRole_Name("ROLE_AGENT");

        long activeAgencies = agencyRepository.countByStatus(AgencyStatus.ACTIVE);
        long suspendedAgencies = agencyRepository.countByStatus(AgencyStatus.SUSPENDED);
        long pendingAgencies = agencyRepository.countByStatus(AgencyStatus.PENDING);

        long activeAgents = countActiveAccountsSafely();

        long transfersToday = countTransfersToday();
        long suspiciousTransactions = countTransfersByStatus(TransferStatus.SUSPECT.name());
        BigDecimal monthlyVolume = sumTransfersForCurrentMonth();
        BigDecimal fullSystemBalance = resolveFullSystemBalance();

        // TODO: wire to PaymentRepository when the Payments module ships.
        long pendingPayments = countPendingPaymentsSafely();
        // TODO: wire to PaymentRepository / ReportingRepository when available.
        BigDecimal totalRevenue = BigDecimal.ZERO;

        return new DashboardKpiDTO(
                fullSystemBalance,
                totalUsers,
                activeAgencies,
                transfersToday,
                pendingPayments,
                totalRevenue,
                activeAgents,
                suspiciousTransactions,
                monthlyVolume,
                totalClients,
                totalAdmins,
                totalManagers,
                totalAgents,
                suspendedAgencies,
                pendingAgencies
        );
    }

    private BigDecimal resolveFullSystemBalance() {
        try {
            return centralAgencyRepository.findByCode("OKANE-HQ")
                    .map(CentralAgency::getCurrentBalance)
                    .map(balance -> balance == null ? BigDecimal.ZERO : balance)
                    .orElseGet(() -> centralAgencyRepository.findAll().stream()
                            .map(CentralAgency::getCurrentBalance)
                            .filter(balance -> balance != null)
                            .reduce(BigDecimal.ZERO, BigDecimal::add));
        } catch (RuntimeException ex) {
            return BigDecimal.ZERO;
        }
    }

    private long countActiveAccountsSafely() {
        try {
            return userRepository.countByEnabledTrueAndAccountSuspendedFalseAndAccountLockedFalse();
        } catch (RuntimeException ex) {
            return 0L;
        }
    }

    private long countPendingPaymentsSafely() {
        try {
            return payoutRepository.countByStatus(PaymentStatus.EN_ATTENTE.name());
        } catch (RuntimeException ex) {
            return 0L;
        }
    }

    private long countTransfersToday() {
        try {
            LocalDate today = LocalDate.now();
            return transferRepository.countByCreatedAtBetween(
                    today.atStartOfDay(),
                    today.atTime(LocalTime.MAX)
            );
        } catch (RuntimeException ex) {
            return 0L;
        }
    }

    private long countTransfersByStatus(String status) {
        try {
            return transferRepository.countByStatus(status);
        } catch (RuntimeException ex) {
            return 0L;
        }
    }

    private BigDecimal sumTransfersForCurrentMonth() {
        try {
            LocalDateTime start = YearMonth.now().atDay(1).atStartOfDay();
            LocalDateTime end = LocalDateTime.now();
            Specification<Transfer> withinMonth = (root, query, cb) -> {
                Predicate fromDate = cb.greaterThanOrEqualTo(root.get("createdAt"), start);
                Predicate toDate = cb.lessThanOrEqualTo(root.get("createdAt"), end);
                return cb.and(fromDate, toDate);
            };
            BigDecimal total = BigDecimal.ZERO;
            for (Transfer transfer : transferRepository.findAll(withinMonth)) {
                if (transfer.getAmount() != null) {
                    total = total.add(transfer.getAmount());
                }
            }
            return total;
        } catch (RuntimeException ex) {
            return BigDecimal.ZERO;
        }
    }

    private List<RecentActivityDTO> loadRecentActivities() {
        List<AuditLog> logs = auditLogRepository.findAllByOrderByCreatedAtDesc(
                PageRequest.of(0, RECENT_ACTIVITIES_LIMIT)
        );
        List<RecentActivityDTO> activities = new ArrayList<>(logs.size());
        for (AuditLog log : logs) {
            String type = safeAction(log.getAction());
            activities.add(new RecentActivityDTO(
                    log.getId(),
                    type,
                    titleFor(log),
                    descriptionFor(log),
                    inferModule(type, log.getEntityName()),
                    actorLabel(log.getUser()),
                    log.getCreatedAt()
            ));
        }
        return activities;
    }

    private List<SystemAlertDTO> buildSystemAlerts(DashboardKpiDTO kpis) {
        List<SystemAlertDTO> alerts = new ArrayList<>();
        LocalDateTime now = LocalDateTime.now();

        if (kpis.suspendedAgencies() > 0) {
            alerts.add(new SystemAlertDTO(
                    "agencies-suspended",
                    kpis.suspendedAgencies() + " agence(s) suspendue(s)",
                    "Au moins une agence est actuellement suspendue. Vérifier la cause et planifier une revue.",
                    "HIGH",
                    "AGENCIES",
                    now,
                    "NEW"
            ));
        }
        if (kpis.pendingAgencies() > 0) {
            alerts.add(new SystemAlertDTO(
                    "agencies-pending",
                    kpis.pendingAgencies() + " agence(s) en attente",
                    "Des agences attendent leur activation. Les valider après revue manager.",
                    "MEDIUM",
                    "AGENCIES",
                    now,
                    "NEW"
            ));
        }
        if (kpis.suspiciousTransactions() > 0) {
            alerts.add(new SystemAlertDTO(
                    "transfers-suspect",
                    kpis.suspiciousTransactions() + " transfert(s) suspect(s)",
                    "Des transferts sont marqués comme suspects et nécessitent une revue conformité.",
                    kpis.suspiciousTransactions() >= 5 ? "CRITICAL" : "HIGH",
                    "TRANSFERS",
                    now,
                    "NEW"
            ));
        }

        long failedLogins24h = countLogins24h("AUTH_LOGIN_FAILURE");
        if (failedLogins24h >= 5) {
            alerts.add(new SystemAlertDTO(
                    "auth-failed-logins",
                    failedLogins24h + " échecs de connexion sur 24h",
                    "Pic de tentatives échouées détecté. Vérifier les comptes ciblés et le rate-limit.",
                    failedLogins24h >= 20 ? "CRITICAL" : "HIGH",
                    "AUTH",
                    now,
                    "NEW"
            ));
        }

        return alerts;
    }

    private DashboardAnalyticsDTO buildAnalytics() {
        return new DashboardAnalyticsDTO(
                buildTransferTrend(),
                buildRevenueTrend(),
                buildUserGrowthTrend()
        );
    }

    private List<TrendPointDTO> buildTransferTrend() {
        List<TrendPointDTO> trend = new ArrayList<>(TRANSFER_TREND_DAYS);
        LocalDate today = LocalDate.now();
        for (int i = TRANSFER_TREND_DAYS - 1; i >= 0; i--) {
            LocalDate day = today.minusDays(i);
            long count = 0L;
            try {
                count = transferRepository.countByCreatedAtBetween(
                        day.atStartOfDay(),
                        day.atTime(LocalTime.MAX)
                );
            } catch (RuntimeException ignored) {
                // fall back to 0 on transient errors
            }
            String label = capitalize(day.getDayOfWeek().getDisplayName(TextStyle.SHORT, FRENCH));
            trend.add(new TrendPointDTO(label, count));
        }
        return trend;
    }

    /** Revenue trend placeholder: empty until {@code PaymentRepository} ships. */
    private List<TrendPointDTO> buildRevenueTrend() {
        // TODO: replace with PaymentRepository.sumValidatedAmountByPeriod once
        // the Payments / Reporting module exposes its repository.
        return List.of();
    }

    private List<TrendPointDTO> buildUserGrowthTrend() {
        List<TrendPointDTO> trend = new ArrayList<>(USER_GROWTH_DAYS);
        LocalDate today = LocalDate.now();
        for (int i = USER_GROWTH_DAYS - 1; i >= 0; i--) {
            LocalDate day = today.minusDays(i);
            long count;
            try {
                count = userRepository.countByCreatedAtBetween(
                        day.atStartOfDay(),
                        day.atTime(LocalTime.MAX)
                );
            } catch (RuntimeException ex) {
                count = 0L;
            }
            String label = capitalize(day.getDayOfWeek().getDisplayName(TextStyle.SHORT, FRENCH));
            trend.add(new TrendPointDTO(label, count));
        }
        return trend;
    }

    private long countLogins24h(String action) {
        try {
            LocalDateTime now = LocalDateTime.now();
            return auditLogRepository.countByActionAndCreatedAtBetween(
                    action,
                    now.minusHours(24),
                    now
            );
        } catch (RuntimeException ex) {
            return 0L;
        }
    }

    private String safeAction(String action) {
        return action == null ? "ACTIVITY" : action;
    }

    private String titleFor(AuditLog log) {
        if (log == null || log.getAction() == null) return "Activité";
        return switch (log.getAction()) {
            case "AUTH_LOGIN_SUCCESS" -> "Connexion réussie";
            case "AUTH_LOGIN_FAILURE" -> "Échec de connexion";
            case "AUTH_LOGOUT" -> "Déconnexion";
            case "AUTH_TOKEN_REFRESH" -> "Renouvellement de session";
            case "AUTH_PASSWORD_CHANGE" -> "Changement de mot de passe";
            case "USER_CREATED" -> "Utilisateur créé";
            case "USER_UPDATED" -> "Utilisateur mis à jour";
            case "USER_STATUS_CHANGED" -> "Statut utilisateur modifié";
            case "USER_DISABLED" -> "Utilisateur désactivé";
            case "AGENCY_CREATED" -> "Agence créée";
            case "AGENCY_UPDATED" -> "Agence mise à jour";
            case "AGENCY_STATUS_CHANGED" -> "Statut agence modifié";
            case "AGENCY_MANAGER_ASSIGNED" -> "Manager assigné";
            case "AGENCY_AGENT_ASSIGNED" -> "Agent assigné";
            case "AGENCY_AGENT_REMOVED" -> "Agent retiré";
            case "AGENCY_DISABLED" -> "Agence désactivée";
            case "TRANSFER_VIEWED" -> "Transfert consulté";
            case "TRANSFER_MARKED_SUSPECT" -> "Transfert marqué suspect";
            case "TRANSFER_CANCELLED" -> "Transfert annulé";
            default -> humanize(log.getAction());
        };
    }

    private String descriptionFor(AuditLog log) {
        if (log.getDescription() != null && !log.getDescription().isBlank()) {
            return log.getDescription();
        }
        StringBuilder builder = new StringBuilder();
        if (log.getEntityName() != null) builder.append(log.getEntityName());
        if (log.getEntityId() != null) {
            if (!builder.isEmpty()) builder.append(' ');
            builder.append('#').append(log.getEntityId());
        }
        return builder.isEmpty() ? "Action enregistrée dans le journal d'audit." : builder.toString();
    }

    private String inferModule(String action, String entityName) {
        if (entityName != null && !entityName.isBlank()) {
            return entityName.toUpperCase(Locale.ROOT);
        }
        if (action == null) return "GENERAL";
        if (action.startsWith("AUTH_")) return "AUTH";
        if (action.startsWith("USER_")) return "USERS";
        if (action.startsWith("AGENCY_")) return "AGENCIES";
        if (action.startsWith("TRANSFER_")) return "TRANSFERS";
        if (action.startsWith("PAYMENT_")) return "PAYMENTS";
        if (action.startsWith("KYC_") || action.startsWith("COMPLIANCE_")) return "COMPLIANCE";
        if (action.startsWith("FX_") || action.startsWith("CURRENCY_")) return "CURRENCY";
        if (action.startsWith("FEE_")) return "FEES";
        if (action.startsWith("REPORT_")) return "REPORTS";
        return "GENERAL";
    }

    private String actorLabel(User user) {
        if (user == null) return "Système";
        String first = user.getFirstName() == null ? "" : user.getFirstName();
        String last = user.getLastName() == null ? "" : user.getLastName();
        String fullName = (first + " " + last).trim();
        return fullName.isEmpty() ? user.getEmail() : fullName;
    }

    private String humanize(String snakeCase) {
        if (snakeCase == null || snakeCase.isBlank()) return "Action";
        String[] parts = snakeCase.toLowerCase(Locale.ROOT).split("_");
        StringBuilder builder = new StringBuilder();
        for (String part : parts) {
            if (part.isEmpty()) continue;
            if (!builder.isEmpty()) builder.append(' ');
            builder.append(Character.toUpperCase(part.charAt(0))).append(part.substring(1));
        }
        return builder.toString();
    }

    private String capitalize(String value) {
        if (value == null || value.isEmpty()) return value;
        String trimmed = value.replace(".", "");
        return Character.toUpperCase(trimmed.charAt(0))
                + (trimmed.length() > 1 ? trimmed.substring(1).toLowerCase(Locale.ROOT) : "");
    }
}
