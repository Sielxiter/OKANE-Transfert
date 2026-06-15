package com.okane.clientmodule.dto;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;

public record ClientTrackTransferDTO(
        String reference,
        String beneficiaryFullName,
        BigDecimal sendAmount,
        String sendCurrency,
        BigDecimal receiveAmount,
        String receiveCurrency,
        String status,
        String receiveCountry,
        LocalDateTime createdAt,
        List<TransferStatusHistoryDTO> statusHistory
) {
}
