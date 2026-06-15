package com.okane.auth.exception;

import org.springframework.http.HttpStatus;

public class AccountLockedException extends ApiException {
    public AccountLockedException(String message) {
        super(HttpStatus.LOCKED, message);
    }
}
