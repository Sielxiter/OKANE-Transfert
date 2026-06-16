package com.okane.agentcash.dto;

import jakarta.validation.constraints.NotNull;
import java.math.BigDecimal;

public record CloseSessionRequestDTO(
        @NotNull BigDecimal actualBalance
) {
}
