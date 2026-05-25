package com.okane.transfer.dto;

public record PayoutResponse(
        TransferResponse transfer,
        PayoutReceiptResponse receipt
) {
}
