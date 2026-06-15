package com.okane.compliancemanagement.exception;

public class AmlAlertNotFoundException extends RuntimeException {
    public AmlAlertNotFoundException(Long id) {
        super("Alerte AML introuvable : " + id);
    }
}
