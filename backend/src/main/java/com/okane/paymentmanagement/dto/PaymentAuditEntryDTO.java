package com.okane.paymentmanagement.dto;

import java.time.LocalDateTime;

public record PaymentAuditEntryDTO(
        Long id,
        String action,
        String description,
        String actor,
        LocalDateTime createdAt
) {
}
