package com.okane.paymentmanagement.dto;

import com.okane.paymentmanagement.domain.PaymentStatus;
import java.time.LocalDate;

public record PaymentFilterDTO(
        String search,
        PaymentStatus status,
        String currency,
        Long agencyId,
        Long agentId,
        LocalDate dateFrom,
        LocalDate dateTo
) {
}
