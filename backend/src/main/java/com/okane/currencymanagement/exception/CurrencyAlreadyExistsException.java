package com.okane.currencymanagement.exception;

import com.okane.auth.exception.ApiException;
import org.springframework.http.HttpStatus;

public class CurrencyAlreadyExistsException extends ApiException {
    public CurrencyAlreadyExistsException(String code) {
        super(HttpStatus.CONFLICT, "Currency code already in use: " + code);
    }
}
