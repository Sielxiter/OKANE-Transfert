package com.okane.cash.dto;

import jakarta.validation.constraints.PositiveOrZero;

public record OpenCashSessionRequest(
        @PositiveOrZero double soldeOuverture
) {
}
