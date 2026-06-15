package com.okane.usermanagement.exception;

import com.okane.auth.exception.ApiException;
import org.springframework.http.HttpStatus;

public class ForbiddenOperationException extends ApiException {
    public ForbiddenOperationException(String message) {
        super(HttpStatus.FORBIDDEN, message);
    }
}
