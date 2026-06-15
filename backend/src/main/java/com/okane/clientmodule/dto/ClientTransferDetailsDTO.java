package com.okane.clientmodule.dto;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;

public record ClientTransferDetailsDTO(
        String reference,
        String senderFullName,
        String senderPhone,
        String beneficiaryFullName,
        String beneficiaryPhone,
        String sendCountry,
        String receiveCountry,
        BigDecimal sendAmount,
        String sendCurrency,
        BigDecimal receiveAmount,
        String receiveCurrency,
        BigDecimal fees,
        BigDecimal exchangeRate,
        String status,
        String agencyName,
        String payoutAgencyName,
        LocalDateTime createdAt,
        List<TransferStatusHistoryDTO> statusHistory
) {
}
