package com.okane.agencybalance.dto;

import java.math.BigDecimal;

public record AgencyBalanceDto(
    Long agencyId,
    String agencyName,
    String agencyCode,
    String agencyType,
    Long centralAgencyId,
    String centralAgencyName,
    BigDecimal currentBalance,
    BigDecimal dailyLimit,
    Integer activeSessions,
    Integer pendingClosures,
    BigDecimal todayInflow,
    BigDecimal todayOutflow,
    String status
) {}
