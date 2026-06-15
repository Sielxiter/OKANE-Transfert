package com.okane.managermodule.dto;

import java.util.List;

public record DashboardOverviewDto(
        String updatedAt,
        List<KpiDto> kpis,
        List<RecentActivityDto> activities,
        List<SystemAlertDto> alerts,
        List<AnalyticsDto> analytics
) {
    public record KpiDto(
            String title,
            String value,
            String icon,
            String accent,
            String note
    ) {}

    public record RecentActivityDto(
            Long id,
            String title,
            String type,
            String module,
            String createdAt
    ) {}

    public record SystemAlertDto(
            Long id,
            String title,
            String description,
            String severity
    ) {}

    public record AnalyticsDto(
            String title,
            String description,
            String accent,
            List<Integer> preview
    ) {}
}
