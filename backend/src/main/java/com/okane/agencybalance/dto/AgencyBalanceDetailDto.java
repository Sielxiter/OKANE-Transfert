package com.okane.agencybalance.dto;

import java.util.List;

public record AgencyBalanceDetailDto(
    AgencyBalanceDto summary,
    List<CashMovementDto> recentMovements,
    List<SessionSummaryDto> activeSessions,
    List<ClosureSummaryDto> pendingClosures
) {}
