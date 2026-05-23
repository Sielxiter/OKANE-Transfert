package com.okane.currencymanagement.exception;

import com.okane.auth.exception.ApiException;
import org.springframework.http.HttpStatus;

public class CorridorNotFoundException extends ApiException {
    public CorridorNotFoundException(Long id) {
        super(HttpStatus.NOT_FOUND, "Corridor not found: " + id);
    }
}
