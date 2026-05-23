package com.okane.agencymanagement.exception;

import com.okane.auth.exception.ApiException;
import org.springframework.http.HttpStatus;

public class InvalidAgentException extends ApiException {
    public InvalidAgentException(String message) {
        super(HttpStatus.BAD_REQUEST, message);
    }
}
