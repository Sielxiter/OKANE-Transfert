package com.okane.currencymanagement.dto;

import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotNull;
import java.math.BigDecimal;

public record UpdateCorridorRequestDTO(
        @DecimalMin(value = "0.0") BigDecimal estimatedFees,
        @NotNull Boolean active
) {
}
