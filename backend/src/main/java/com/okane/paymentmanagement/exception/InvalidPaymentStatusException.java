package com.okane.paymentmanagement.exception;

import com.okane.auth.exception.ApiException;
import org.springframework.http.HttpStatus;

public class InvalidPaymentStatusException extends ApiException {
    public InvalidPaymentStatusException(String message) {
        super(HttpStatus.CONFLICT, message);
    }
}
