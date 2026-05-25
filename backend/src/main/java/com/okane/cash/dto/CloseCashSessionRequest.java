package com.okane.cash.dto;

import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.PositiveOrZero;

public record CloseCashSessionRequest(
        @NotNull @PositiveOrZero Double montantReel,
        String commentaire
) {
}
