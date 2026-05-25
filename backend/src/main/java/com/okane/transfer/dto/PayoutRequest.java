package com.okane.transfer.dto;

public record PayoutRequest(
        Long transferId,
        String reference,
        String codeRetrait,
        String withdrawCode,
        String beneficiaryDocumentType,
        String beneficiaryDocumentNumber,
        String receiverIdType,
        String receiverIdNumber
) {
}
