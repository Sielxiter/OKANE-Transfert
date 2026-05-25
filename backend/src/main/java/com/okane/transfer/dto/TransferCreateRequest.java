package com.okane.transfer.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;

public record TransferCreateRequest(
        @NotBlank String senderFirstName,
        @NotBlank String senderLastName,
        @NotBlank String senderPhone,
        @NotBlank String senderCountry,
        @NotBlank String senderIdType,
        @NotBlank String senderIdNumber,
        @NotBlank String receiverFirstName,
        @NotBlank String receiverLastName,
        @NotBlank String receiverPhone,
        @NotBlank String receiverCountry,
        @NotBlank String beneficiaryDocumentType,
        @NotBlank String beneficiaryDocumentNumber,
        @NotBlank String destinationCountry,
        @NotBlank String sourceCurrency,
        @NotBlank String destinationCurrency,
        @NotNull @Positive Double amountSent,
        @NotNull @Positive Double fees,
        @NotNull @Positive Double amountReceived,
        @NotNull @Positive Double exchangeRate
) {
}
