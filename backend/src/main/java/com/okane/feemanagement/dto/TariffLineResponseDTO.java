package com.okane.feemanagement.dto;

import com.okane.feemanagement.domain.TariffValueType;
import java.math.BigDecimal;
import java.time.LocalDateTime;

public record TariffLineResponseDTO(
        Long id,
        BigDecimal minAmount,
        BigDecimal maxAmount,
        TariffValueType transferFeeType,
        BigDecimal transferFeeValue,
        TariffValueType agencyCommissionType,
        BigDecimal agencyCommissionValue,
        TariffValueType centralCommissionType,
        BigDecimal centralCommissionValue,
        LocalDateTime createdAt,
        LocalDateTime updatedAt
) {
}
