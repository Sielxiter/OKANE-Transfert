package com.okane.dashboard.dto;

import java.math.BigDecimal;

/**
 * KPI card values for the admin dashboard. The eight headline values match the
 * cards rendered on the frontend; the additional breakdown fields are read-only
 * extras used by the card subtitles (e.g. "1 clients • 1 managers • 1 agents").
 */
public record DashboardKpiDTO(
        long totalUsers,
        long activeAgencies,
        long transfersToday,
        long pendingPayments,
        BigDecimal totalRevenue,
        long activeAgents,
        long suspiciousTransactions,
        BigDecimal monthlyVolume,
        // Breakdown extras used by the card subtitles. They are computed from
        // the same repositories so they stay consistent with the headline KPIs.
        long totalClients,
        long totalAdmins,
        long totalManagers,
        long totalAgents,
        long suspendedAgencies,
        long pendingAgencies
) {
}
