package com.okane.agencymanagement.exception;

import com.okane.auth.exception.ApiException;
import org.springframework.http.HttpStatus;

public class InvalidAgencyStatusException extends ApiException {
    public InvalidAgencyStatusException(String message) {
        super(HttpStatus.BAD_REQUEST, message);
    }
}
