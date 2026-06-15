package com.okane.clientmodule.dto;

import java.math.BigDecimal;

public record ClientDashboardSummaryDTO(
        long totalTransfers,
        long pendingTransfers,
        long paidTransfers,
        long cancelledTransfers,
        long expiredTransfers,
        BigDecimal totalSentAmount,
        BigDecimal totalReceivedAmount,
        BigDecimal totalFeesPaid,
        String defaultCurrency
) {
}
