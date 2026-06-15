package com.okane.paymentmanagement.dto;

import java.math.BigDecimal;

public record PaymentSummaryDTO(
        long totalPayments,
        long paymentsToday,
        long pendingPayments,
        long validatedPayments,
        long failedPayments,
        BigDecimal totalPaidAmount
) {
}
