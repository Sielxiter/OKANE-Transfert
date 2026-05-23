package com.okane.feemanagement.dto;

import java.math.BigDecimal;

public record FeeSummaryDTO(
        long activeFeeGrids,
        BigDecimal averageFee,
        BigDecimal centralCommission,
        BigDecimal agencyCommission,
        long simulationsToday
) {
}
