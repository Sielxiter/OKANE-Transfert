package com.okane.usermanagement.dto;

import com.okane.usermanagement.domain.AccountStatus;
import jakarta.validation.constraints.NotNull;

public record ChangeUserStatusRequestDTO(
        @NotNull AccountStatus status
) {
}
