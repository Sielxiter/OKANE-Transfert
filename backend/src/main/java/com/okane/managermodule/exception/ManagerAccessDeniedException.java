package com.okane.managermodule.exception;

public class ManagerAccessDeniedException extends RuntimeException {
    public ManagerAccessDeniedException(String message) {
        super(message);
    }
}
