package com.okane.transfermanagement.exception;

import com.okane.auth.exception.ApiException;
import org.springframework.http.HttpStatus;

public class InvalidTransferStatusException extends ApiException {
    public InvalidTransferStatusException(String message) {
        super(HttpStatus.CONFLICT, message);
    }
}
