package com.okane.currencymanagement.dto;

import com.okane.currencymanagement.domain.CurrencyStatus;
import jakarta.validation.constraints.NotNull;

public record ChangeCurrencyStatusRequestDTO(
        @NotNull CurrencyStatus status
) {
}
