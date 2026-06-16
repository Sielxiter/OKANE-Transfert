package com.okane.transfermanagement.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.Pattern;
import java.math.BigDecimal;

public record CreateAgentTransferRequestDTO(
        @NotNull Long senderClientId,
        @NotBlank String senderCountryCode,
        @NotBlank String beneficiaryFirstName,
        @NotBlank String beneficiaryLastName,
        @NotBlank @Email String beneficiaryEmail,
        @NotBlank @Pattern(regexp = "^\\+?[0-9]{6,18}$", message = "Le telephone doit contenir uniquement des chiffres.") String beneficiaryPhone,
        @NotBlank String beneficiaryIdentityType,
        @NotBlank String beneficiaryIdentityNumber,
        @NotBlank String beneficiaryCountryCode,
        @NotBlank String sourceCurrencyCode,
        @NotBlank String destinationCurrencyCode,
        @NotNull @Positive BigDecimal amount,
        BigDecimal exchangeRate,
        String paymentMethod
) {
}
