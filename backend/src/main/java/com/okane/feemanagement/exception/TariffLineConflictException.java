package com.okane.feemanagement.exception;

import com.okane.auth.exception.ApiException;
import org.springframework.http.HttpStatus;

public class TariffLineConflictException extends ApiException {
    public TariffLineConflictException(String message) {
        super(HttpStatus.BAD_REQUEST, message);
    }
}
