package com.okane.dashboard.dto;

import java.util.List;

public record DashboardAnalyticsDTO(
        List<TrendPointDTO> transferTrend,
        List<TrendPointDTO> revenueTrend,
        List<TrendPointDTO> userGrowth
) {
}
