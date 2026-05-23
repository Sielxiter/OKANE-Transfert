package com.okane.feemanagement.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;
import jakarta.validation.constraints.Size;
import java.math.BigDecimal;

public record FeeSimulationRequestDTO(
        @NotNull @Positive BigDecimal amount,
        @NotBlank @Size(max = 10) String currency,
        @NotBlank @Size(max = 10) String sourceCountry,
        @NotBlank @Size(max = 10) String destinationCountry
) {
}
