package com.okane.dashboard.dto;

import java.util.List;

public record AdminDashboardResponseDTO(
        DashboardKpiDTO kpis,
        List<RecentActivityDTO> recentActivities,
        List<SystemAlertDTO> systemAlerts,
        DashboardAnalyticsDTO analytics
) {
}
