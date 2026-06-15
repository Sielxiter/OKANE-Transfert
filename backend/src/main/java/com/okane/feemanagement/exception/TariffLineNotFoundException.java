package com.okane.feemanagement.exception;

import com.okane.auth.exception.ApiException;
import org.springframework.http.HttpStatus;

public class TariffLineNotFoundException extends ApiException {
    public TariffLineNotFoundException(Long id) {
        super(HttpStatus.NOT_FOUND, "Tariff line not found: " + id);
    }
}
