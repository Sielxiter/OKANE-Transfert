package com.okane.usermanagement.exception;

import com.okane.auth.exception.ApiException;
import org.springframework.http.HttpStatus;

public class InvalidRoleException extends ApiException {
    public InvalidRoleException(String role) {
        super(HttpStatus.BAD_REQUEST, "Invalid role: " + role);
    }
}
