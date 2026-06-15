package com.okane.auditmanagement.exception;

public class AuditLogNotFoundException extends RuntimeException {

    public AuditLogNotFoundException(Long id) {
        super("Log d'audit introuvable : " + id);
    }
}
