package com.okane.manager.dto;

import jakarta.validation.constraints.NotBlank;

public record ManagerCancelPayoutRequest(
        @NotBlank String raison
) {}