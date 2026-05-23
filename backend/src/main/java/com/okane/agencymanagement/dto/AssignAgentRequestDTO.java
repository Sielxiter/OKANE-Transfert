package com.okane.agencymanagement.dto;

import jakarta.validation.constraints.NotNull;

public record AssignAgentRequestDTO(
        @NotNull Long agentId
) {
}
