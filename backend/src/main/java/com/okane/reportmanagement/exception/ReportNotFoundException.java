package com.okane.reportmanagement.exception;

public class ReportNotFoundException extends RuntimeException {

    public ReportNotFoundException(Long id) {
        super("Rapport introuvable : " + id);
    }
}
