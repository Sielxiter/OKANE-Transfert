package com.okane.paymentmanagement.dto;

import com.okane.paymentmanagement.domain.PaymentStatus;
import java.math.BigDecimal;
import java.time.LocalDateTime;

/**
 * Lightweight receipt projection for the {@code /payments/{id}/receipt}
 * endpoint. Holds only data the admin needs to inspect a paid transfer
 * without exposing IDs or fields beyond the existing payment response.
 */
public record PaymentReceiptDTO(
        Long id,
        String paymentReference,
        String transferReference,
        String withdrawalCode,
        String beneficiaryName,
        BigDecimal amountPaid,
        String currency,
        String agencyName,
        String agentName,
        PaymentStatus status,
        LocalDateTime paymentDate
) {
}
