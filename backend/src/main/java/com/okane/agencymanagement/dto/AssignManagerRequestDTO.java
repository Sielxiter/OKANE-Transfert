package com.okane.agencymanagement.dto;

import jakarta.validation.constraints.NotNull;

public record AssignManagerRequestDTO(
        @NotNull Long managerId
) {
}
