package com.okane.currencymanagement.exception;

import com.okane.auth.exception.ApiException;
import org.springframework.http.HttpStatus;

public class CurrencyNotFoundException extends ApiException {
    public CurrencyNotFoundException(Long id) {
        super(HttpStatus.NOT_FOUND, "Currency not found: " + id);
    }
}
