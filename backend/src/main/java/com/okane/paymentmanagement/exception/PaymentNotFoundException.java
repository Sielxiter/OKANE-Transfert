package com.okane.paymentmanagement.exception;

import com.okane.auth.exception.ApiException;
import org.springframework.http.HttpStatus;

public class PaymentNotFoundException extends ApiException {
    public PaymentNotFoundException(Long id) {
        super(HttpStatus.NOT_FOUND, "Payment not found: " + id);
    }
}
