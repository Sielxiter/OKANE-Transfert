package com.okane.manager.controller;

import com.okane.manager.dto.ManagerCancelPayoutRequest;
import com.okane.manager.dto.ManagerPaymentResponse;
import com.okane.manager.service.ManagerPaymentService;
import jakarta.validation.Valid;
import java.util.List;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/manager/payments")
public class ManagerPaymentController {

    private final ManagerPaymentService paymentService;

    public ManagerPaymentController(ManagerPaymentService paymentService) {
        this.paymentService = paymentService;
    }

    @GetMapping
    public ResponseEntity<List<ManagerPaymentResponse>> getAllPayments(Authentication authentication) {
        return ResponseEntity.ok(paymentService.getAllPayments(authentication));
    }

    @GetMapping("/pending")
    public ResponseEntity<List<ManagerPaymentResponse>> getPendingPayments(Authentication authentication) {
        return ResponseEntity.ok(paymentService.getPendingPayments(authentication));
    }

    @PostMapping("/{transferId}/cancel")
    public ResponseEntity<ManagerPaymentResponse> cancelPayout(
            @PathVariable Long transferId,
            @Valid @RequestBody ManagerCancelPayoutRequest request,
            Authentication authentication
    ) {
        return ResponseEntity.ok(paymentService.cancelPayout(authentication, transferId, request));
    }
}