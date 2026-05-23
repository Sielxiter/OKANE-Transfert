package com.okane.feemanagement.exception;

import com.okane.auth.exception.ApiException;
import org.springframework.http.HttpStatus;

public class NoActiveFeeGridException extends ApiException {
    public NoActiveFeeGridException(String message) {
        super(HttpStatus.NOT_FOUND, message);
    }
}
