package com.okane.agencymanagement.exception;

import com.okane.auth.exception.ApiException;
import org.springframework.http.HttpStatus;

public class AgencyCodeAlreadyExistsException extends ApiException {
    public AgencyCodeAlreadyExistsException(String code) {
        super(HttpStatus.CONFLICT, "Agency code already in use: " + code);
    }
}
