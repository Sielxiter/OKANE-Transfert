package com.okane.feemanagement.dto;

import com.okane.feemanagement.domain.FeeGridStatus;
import jakarta.validation.constraints.NotNull;

public record ChangeFeeGridStatusRequestDTO(
        @NotNull FeeGridStatus status
) {
}
