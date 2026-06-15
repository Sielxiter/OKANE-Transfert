package com.okane.agencymanagement.exception;

import com.okane.auth.exception.ApiException;
import org.springframework.http.HttpStatus;

public class AgencyNotFoundException extends ApiException {
    public AgencyNotFoundException(Long id) {
        super(HttpStatus.NOT_FOUND, "Agency not found: " + id);
    }
}
