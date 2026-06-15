package com.okane.currencymanagement.dto;

import com.okane.currencymanagement.domain.CorridorStatus;
import jakarta.validation.constraints.NotNull;

public record ChangeCorridorStatusRequestDTO(
        @NotNull CorridorStatus status
) {
}
