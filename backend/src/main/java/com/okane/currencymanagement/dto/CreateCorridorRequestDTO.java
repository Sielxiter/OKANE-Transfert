package com.okane.currencymanagement.dto;

import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import java.math.BigDecimal;

public record CreateCorridorRequestDTO(
        @NotBlank @Size(max = 10) String sourceCountryCode,
        @NotBlank @Size(max = 10) String destinationCountryCode,
        @DecimalMin(value = "0.0") BigDecimal estimatedFees,
        @NotNull Boolean active
) {
}
