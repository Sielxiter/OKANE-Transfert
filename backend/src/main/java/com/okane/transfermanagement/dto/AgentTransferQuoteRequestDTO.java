package com.okane.transfermanagement.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;
import java.math.BigDecimal;

public record AgentTransferQuoteRequestDTO(
        @NotNull @Positive BigDecimal amount,
        @NotBlank String senderCountryCode,
        @NotBlank String beneficiaryCountryCode,
        @NotBlank String sourceCurrencyCode,
        @NotBlank String destinationCurrencyCode
) {
}
