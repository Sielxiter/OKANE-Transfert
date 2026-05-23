package com.okane.feemanagement.exception;

import com.okane.auth.exception.ApiException;
import org.springframework.http.HttpStatus;

public class FeeGridNotFoundException extends ApiException {
    public FeeGridNotFoundException(Long id) {
        super(HttpStatus.NOT_FOUND, "Fee grid not found: " + id);
    }
}
