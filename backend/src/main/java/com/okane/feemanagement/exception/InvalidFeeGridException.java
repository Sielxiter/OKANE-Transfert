package com.okane.feemanagement.exception;

import com.okane.auth.exception.ApiException;
import org.springframework.http.HttpStatus;

public class InvalidFeeGridException extends ApiException {
    public InvalidFeeGridException(String message) {
        super(HttpStatus.BAD_REQUEST, message);
    }
}
