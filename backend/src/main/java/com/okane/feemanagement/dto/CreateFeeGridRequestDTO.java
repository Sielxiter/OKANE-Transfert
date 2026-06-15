package com.okane.feemanagement.dto;

import com.okane.feemanagement.domain.FeeGridStatus;
import jakarta.validation.constraints.DecimalMax;
import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.PositiveOrZero;
import jakarta.validation.constraints.Size;
import java.math.BigDecimal;

public record CreateFeeGridRequestDTO(
        @NotBlank @Size(max = 150) String name,
        @NotBlank @Size(max = 10) String sourceCountry,
        @NotBlank @Size(max = 10) String destinationCountry,
        @NotBlank @Size(max = 10) String currency,
        @NotNull @PositiveOrZero BigDecimal minAmount,
        @NotNull @PositiveOrZero BigDecimal maxAmount,
        @NotNull @PositiveOrZero BigDecimal fixedFee,
        @NotNull @PositiveOrZero @DecimalMax("100.00") BigDecimal percentageFee,
        @NotNull @PositiveOrZero @DecimalMax("100.00") BigDecimal agencyCommissionRate,
        @NotNull @PositiveOrZero @DecimalMax("100.00") BigDecimal centralCommissionRate,
        FeeGridStatus status
) {
}
