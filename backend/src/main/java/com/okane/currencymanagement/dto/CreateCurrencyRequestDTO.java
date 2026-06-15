package com.okane.currencymanagement.dto;

import com.okane.currencymanagement.domain.CurrencyStatus;
import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;
import jakarta.validation.constraints.Size;
import java.math.BigDecimal;

public record CreateCurrencyRequestDTO(
        @NotBlank @Size(max = 100) String name,
        @NotBlank @Size(max = 20) String symbol,
        @Size(max = 100) String mainCountry,
        @NotNull @Positive @DecimalMin(value = "0.000001") BigDecimal rateToMad,
        CurrencyStatus status
) {
}
