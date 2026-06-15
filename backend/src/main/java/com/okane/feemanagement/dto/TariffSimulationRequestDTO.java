package com.okane.feemanagement.dto;

import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;
import java.math.BigDecimal;

public record TariffSimulationRequestDTO(
        @NotNull @Positive BigDecimal amount,
        @NotNull Long corridorId
) {
}
