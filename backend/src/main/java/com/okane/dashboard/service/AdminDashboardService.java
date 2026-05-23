package com.okane.dashboard.service;

import com.okane.agency.repository.AgencyRepository;
import com.okane.agencymanagement.domain.AgencyStatus;
import com.okane.audit.entity.AuditLog;
import com.okane.auth.entity.User;
import com.okane.auth.repository.AuditLogRepository;
import com.okane.auth.repository.UserRepository;
import com.okane.dashboard.dto.AdminDashboardResponseDTO;
import com.okane.dashboard.dto.DashboardAnalyticsDTO;
import com.okane.dashboard.dto.DashboardKpiDTO;
import com.okane.dashboard.dto.RecentActivityDTO;
import com.okane.dashboard.dto.SystemAlertDTO;
import com.okane.dashboard.dto.TrendPointDTO;
import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;
import java.time.format.TextStyle;
import java.util.ArrayList;
import java.util.List;
import java.util.Locale;
import org.springframework.data.domain.PageRequest;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

/**
 * Aggregates dashboard data for the admin home screen.
 *
 * <p>This service is deliberately resilient: when downstream modules
 * (Transfers, Payments, Compliance, Reporting) are not implemented yet, the
 * corresponding KPIs and analytics fall back to {@code 0} or empty lists. Real
 * values will be wired in as the matching modules are built, without breaking
 * the JSON contract consumed by the frontend.
 */
@Service
public class AdminDashboardService {

    private static final int RECENT_ACTIVITIES_LIMIT = 8;
    private static final int USER_GROWTH_DAYS = 7;
    private static final Locale FRENCH = Locale.FRENCH;

    private final UserRepository userRepository;
    private final AgencyRepository agencyRepository;
    private final AuditLogRepository auditLogRepository;

    public AdminDashboardService(
            UserRepository userRepository,
            AgencyRepository agencyRepository,
            AuditLogRepository auditLogRepository
    ) {
        this.userRepository = userRepository;
        this.agencyRepository = agencyRepository;
        this.auditLogRepository = auditLogRepository;
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

        // TODO: wire to TransferRepository when the Transfers module ships.
        long transfersToday = 0L;
        // TODO: wire to PaymentRepository when the Payments module ships.
        long pendingPayments = 0L;
        // TODO: wire to PaymentRepository / ReportingRepository when available.
        BigDecimal totalRevenue = BigDecimal.ZERO;
        // TODO: wire to TransferRepository / ComplianceRepository when ready.
        long suspiciousTransactions = 0L;
        // TODO: sum transfers between startOfMonth and now once Transfers ships.
        BigDecimal monthlyVolume = BigDecimal.ZERO;

        return new DashboardKpiDTO(
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

    private long countActiveAccountsSafely() {
        try {
            return userRepository.countByEnabledTrueAndAccountSuspendedFalseAndAccountLockedFalse();
        } catch (RuntimeException ex) {
            return 0L;
        }
    }

    private List<RecentActivityDTO> loadRecentActivities() {
        List<AuditLog> logs = auditLogRepository.findAllByOrderByCreatedAtDesc(
                PageRequest.of(0, RECENT_ACTIVITIES_LIMIT)
        );
        List<RecentActivityDTO> activities = new ArrayList<>(logs.size());
        for (AuditLog log : logs) {
            String type = log.getAction() == null ? "ACTIVITY" : log.getAction();
            String title = humaniseTitle(type, log.getEntityName());
            String description = safeDescription(log);
            String module = inferModule(type, log.getEntityName());
            activities.add(new RecentActivityDTO(
                    log.getId(),
                    type,
                    title,
                    description,
                    module,
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

        // TODO: append compliance / KYC / payment / transfer alerts once those
        // modules expose dedicated repositories. Today the list is purely
        // derived from agency state to avoid fabricating data.
        return alerts;
    }

    private DashboardAnalyticsDTO buildAnalytics() {
        return new DashboardAnalyticsDTO(
                // TODO: TransferRepository.countByCreatedAtBetween() per day.
                List.of(),
                // TODO: PaymentRepository.sumValidatedPayments() per period.
                List.of(),
                buildUserGrowth()
        );
    }

    /**
     * Returns one bucket per day for the last {@value #USER_GROWTH_DAYS} days
     * with the count of users created that day. The label is the localised
     * three-letter weekday (e.g. "lun.").
     */
    private List<TrendPointDTO> buildUserGrowth() {
        List<TrendPointDTO> series = new ArrayList<>(USER_GROWTH_DAYS);
        LocalDate today = LocalDate.now();
        for (int offset = USER_GROWTH_DAYS - 1; offset >= 0; offset--) {
            LocalDate day = today.minusDays(offset);
            LocalDateTime start = day.atStartOfDay();
            LocalDateTime end = day.atTime(LocalTime.MAX);
            long count;
            try {
                count = userRepository.countByCreatedAtBetween(start, end);
            } catch (RuntimeException ex) {
                count = 0L;
            }
            String label = day.getDayOfWeek().getDisplayName(TextStyle.SHORT, FRENCH);
            series.add(new TrendPointDTO(label, count));
        }
        return series;
    }

    private String humaniseTitle(String action, String entityName) {
        String upper = action == null ? "" : action.toUpperCase(Locale.ROOT);
        return switch (upper) {
            case "AUTH_LOGIN_SUCCESS" -> "Connexion réussie";
            case "AUTH_LOGIN_FAILURE" -> "Échec de connexion";
            case "AUTH_LOGOUT" -> "Déconnexion";
            case "AUTH_TOKEN_REFRESH" -> "Jeton rafraîchi";
            case "AUTH_PASSWORD_CHANGE" -> "Mot de passe modifié";
            case "AUTH_ACCOUNT_LOCKED_OR_SUSPENDED" -> "Compte verrouillé ou suspendu";
            case "USER_CREATED" -> "Utilisateur créé";
            case "USER_UPDATED" -> "Utilisateur mis à jour";
            case "USER_STATUS_CHANGED" -> "Statut utilisateur modifié";
            case "USER_DISABLED" -> "Utilisateur désactivé";
            case "AGENCY_CREATED" -> "Agence créée";
            case "AGENCY_UPDATED" -> "Agence mise à jour";
            case "AGENCY_STATUS_CHANGED" -> "Statut agence modifié";
            case "AGENCY_MANAGER_ASSIGNED" -> "Manager affecté";
            case "AGENCY_AGENT_ASSIGNED" -> "Agent affecté";
            case "AGENCY_AGENT_REMOVED" -> "Agent retiré";
            case "AGENCY_DISABLED" -> "Agence désactivée";
            default -> entityName != null && !entityName.isBlank()
                    ? entityName + " : " + upper.replace('_', ' ').toLowerCase(Locale.ROOT)
                    : upper.replace('_', ' ');
        };
    }

    private String safeDescription(AuditLog log) {
        if (log.getDescription() != null && !log.getDescription().isBlank()) {
            return log.getDescription();
        }
        StringBuilder builder = new StringBuilder();
        if (log.getEntityName() != null) {
            builder.append(log.getEntityName());
        }
        if (log.getEntityId() != null) {
            if (builder.length() > 0) {
                builder.append(" #");
            }
            builder.append(log.getEntityId());
        }
        return builder.length() == 0 ? "Événement enregistré" : builder.toString();
    }

    private String actorLabel(User user) {
        if (user == null) {
            return "Système";
        }
        String first = user.getFirstName() == null ? "" : user.getFirstName();
        String last = user.getLastName() == null ? "" : user.getLastName();
        String fullName = (first + " " + last).trim();
        return fullName.isEmpty() ? user.getEmail() : fullName;
    }

    private String inferModule(String action, String entityName) {
        if (entityName != null && !entityName.isBlank()) {
            return entityName.toUpperCase(Locale.ROOT);
        }
        if (action == null) {
            return "GENERAL";
        }
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
}
