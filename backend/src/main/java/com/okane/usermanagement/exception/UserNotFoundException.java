package com.okane.usermanagement.exception;

import com.okane.auth.exception.ApiException;
import org.springframework.http.HttpStatus;

public class UserNotFoundException extends ApiException {
    public UserNotFoundException(Long id) {
        super(HttpStatus.NOT_FOUND, "User not found: " + id);
    }
}
