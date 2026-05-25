package com.okane.transfer.dto;

public record PayoutReceiptResponse(
        String paidAt,
        String paidBy,
        String agencyName,
        String receiverIdLabel
) {
}
