package com.okane.compliancemanagement.exception;

public class KycRecordNotFoundException extends RuntimeException {
    public KycRecordNotFoundException(Long id) {
        super("Dossier KYC introuvable : " + id);
    }
}
