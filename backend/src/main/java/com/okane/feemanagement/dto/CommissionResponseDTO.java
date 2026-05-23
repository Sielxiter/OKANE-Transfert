package com.okane.feemanagement.dto;

import java.math.BigDecimal;

public record CommissionResponseDTO(
        Long agencyId,
        String agencyCode,
        String agencyName,
        String corridor,
        String currency,
        BigDecimal volume,
        BigDecimal agencyCommission,
        BigDecimal centralCommission,
        long transferCount
) {
}
