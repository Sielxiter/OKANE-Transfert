package com.okane.agencymanagement.exception;

import com.okane.auth.exception.ApiException;
import org.springframework.http.HttpStatus;

public class AgencyEmailAlreadyExistsException extends ApiException {
    public AgencyEmailAlreadyExistsException(String email) {
        super(HttpStatus.CONFLICT, "Agency email already in use: " + email);
    }
}
