package com.okane.currencymanagement.exception;

import com.okane.auth.exception.ApiException;
import org.springframework.http.HttpStatus;

public class CurrencyAlreadyExistsException extends ApiException {
    public CurrencyAlreadyExistsException(String identifier) {
        super(HttpStatus.CONFLICT, "Currency identifier already in use: " + identifier);
    }
}
