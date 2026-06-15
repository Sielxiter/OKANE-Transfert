package com.okane.clientmodule.dto;

import java.math.BigDecimal;
import java.time.LocalDateTime;

public record ClientTransferListItemDTO(
        String reference,
        String beneficiaryFullName,
        String sendCountry,
        String receiveCountry,
        BigDecimal sendAmount,
        String sendCurrency,
        BigDecimal receiveAmount,
        String receiveCurrency,
        BigDecimal fees,
        String status,
        LocalDateTime createdAt
) {
}
