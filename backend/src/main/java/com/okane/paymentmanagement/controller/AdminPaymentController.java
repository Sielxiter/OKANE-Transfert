package com.okane.paymentmanagement.controller;

import com.okane.paymentmanagement.domain.PaymentStatus;
import com.okane.paymentmanagement.dto.PaymentAuditEntryDTO;
import com.okane.paymentmanagement.dto.PaymentFilterDTO;
import com.okane.paymentmanagement.dto.PaymentReceiptDTO;
import com.okane.paymentmanagement.dto.PaymentResponseDTO;
import com.okane.paymentmanagement.dto.PaymentSummaryDTO;
import com.okane.paymentmanagement.service.AdminPaymentService;
import java.time.LocalDate;
import java.util.List;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

/**
 * Admin endpoints for supervising payments. Path-level security is already
 * enforced in {@code SecurityConfig} ({@code /api/admin/** -> hasRole("ADMIN")});
 * the {@code @PreAuthorize} annotation here adds a method-level guard.
 */
@RestController
@RequestMapping("/api/admin/payments")
@PreAuthorize("hasRole('ADMIN')")
public class AdminPaymentController {

    private final AdminPaymentService adminPaymentService;

    public AdminPaymentController(AdminPaymentService adminPaymentService) {
        this.adminPaymentService = adminPaymentService;
    }

    @GetMapping
    public ResponseEntity<List<PaymentResponseDTO>> list(
            @RequestParam(value = "search", required = false) String search,
            @RequestParam(value = "status", required = false) PaymentStatus status,
            @RequestParam(value = "currency", required = false) String currency,
            @RequestParam(value = "agencyId", required = false) Long agencyId,
            @RequestParam(value = "agentId", required = false) Long agentId,
            @RequestParam(value = "dateFrom", required = false)
            @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate dateFrom,
            @RequestParam(value = "dateTo", required = false)
            @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate dateTo
    ) {
        PaymentFilterDTO filter = new PaymentFilterDTO(
                search, status, currency, agencyId, agentId, dateFrom, dateTo
        );
        return ResponseEntity.ok(adminPaymentService.findAll(filter));
    }

    @GetMapping("/summary")
    public ResponseEntity<PaymentSummaryDTO> summary() {
        return ResponseEntity.ok(adminPaymentService.getSummary());
    }

    @GetMapping("/{id}")
    public ResponseEntity<PaymentResponseDTO> getById(
            @PathVariable Long id,
            Authentication authentication
    ) {
        return ResponseEntity.ok(adminPaymentService.findById(id, authentication));
    }

    @PatchMapping("/{id}/block")
    public ResponseEntity<PaymentResponseDTO> block(
            @PathVariable Long id,
            Authentication authentication
    ) {
        return ResponseEntity.ok(adminPaymentService.block(id, authentication));
    }

    @GetMapping("/{id}/receipt")
    public ResponseEntity<PaymentReceiptDTO> receipt(
            @PathVariable Long id,
            Authentication authentication
    ) {
        return ResponseEntity.ok(adminPaymentService.viewReceipt(id, authentication));
    }

    @GetMapping("/{id}/audit")
    public ResponseEntity<List<PaymentAuditEntryDTO>> audit(@PathVariable Long id) {
        return ResponseEntity.ok(adminPaymentService.findAuditTrail(id));
    }
}
