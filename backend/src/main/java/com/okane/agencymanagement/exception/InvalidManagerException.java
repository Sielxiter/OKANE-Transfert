package com.okane.agencymanagement.exception;

import com.okane.auth.exception.ApiException;
import org.springframework.http.HttpStatus;

public class InvalidManagerException extends ApiException {
    public InvalidManagerException(String message) {
        super(HttpStatus.BAD_REQUEST, message);
    }
}
