package com.okane.feemanagement.dto;

import com.okane.feemanagement.domain.TariffValueType;
import jakarta.validation.constraints.DecimalMax;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.PositiveOrZero;
import java.math.BigDecimal;

public record CreateTariffLineRequestDTO(
        @NotNull @PositiveOrZero BigDecimal minAmount,
        @NotNull @PositiveOrZero BigDecimal maxAmount,
        @NotNull TariffValueType transferFeeType,
        @NotNull @PositiveOrZero @DecimalMax("1000000.00") BigDecimal transferFeeValue,
        @NotNull TariffValueType agencyCommissionType,
        @NotNull @PositiveOrZero @DecimalMax("1000000.00") BigDecimal agencyCommissionValue,
        @NotNull TariffValueType centralCommissionType,
        @NotNull @PositiveOrZero @DecimalMax("1000000.00") BigDecimal centralCommissionValue
) {
}
