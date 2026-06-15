package com.okane.currencymanagement.exception;

import com.okane.auth.exception.ApiException;
import org.springframework.http.HttpStatus;

public class InvalidCurrencyStatusException extends ApiException {
    public InvalidCurrencyStatusException(String message) {
        super(HttpStatus.CONFLICT, message);
    }
}
