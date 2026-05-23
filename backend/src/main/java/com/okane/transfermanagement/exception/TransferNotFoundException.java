package com.okane.transfermanagement.exception;

import com.okane.auth.exception.ApiException;
import org.springframework.http.HttpStatus;

public class TransferNotFoundException extends ApiException {
    public TransferNotFoundException(Long id) {
        super(HttpStatus.NOT_FOUND, "Transfer not found: " + id);
    }
}
