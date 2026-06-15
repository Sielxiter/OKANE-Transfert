package com.okane.currencymanagement.exception;

import com.okane.auth.exception.ApiException;
import org.springframework.http.HttpStatus;

public class CorridorAlreadyExistsException extends ApiException {
    public CorridorAlreadyExistsException(String source, String destination) {
        super(HttpStatus.CONFLICT, "Un corridor actif existe déjà pour " + source + " → " + destination);
    }
}
