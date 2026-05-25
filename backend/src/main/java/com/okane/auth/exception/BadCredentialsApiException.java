package com.okane.auth.exception;

import org.springframework.http.HttpStatus;

public class BadCredentialsApiException extends ApiException {
    public BadCredentialsApiException(String message) {
        super(HttpStatus.UNAUTHORIZED, message);
    }
}
