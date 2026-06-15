package com.okane.currencymanagement.controller;

import com.okane.currencymanagement.dto.ChangeCurrencyStatusRequestDTO;
import com.okane.currencymanagement.dto.CorridorResponseDTO;
import com.okane.currencymanagement.dto.CreateCurrencyRequestDTO;
import com.okane.currencymanagement.dto.CurrencyResponseDTO;
import com.okane.currencymanagement.dto.CurrencySummaryDTO;
import com.okane.currencymanagement.dto.ExchangeRateHistoryDTO;
import com.okane.currencymanagement.service.AdminCurrencyService;
import jakarta.validation.Valid;
import java.util.List;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

/**
 * Admin endpoints for currencies, corridors and FX history. Path-level security
 * comes from {@code SecurityConfig} (/api/admin/**); method-level security adds
 * a second guard for clarity.
 */
@RestController
@RequestMapping("/api/admin/currency")
@PreAuthorize("hasRole('ADMIN')")
public class AdminCurrencyController {

    private final AdminCurrencyService adminCurrencyService;

    public AdminCurrencyController(AdminCurrencyService adminCurrencyService) {
        this.adminCurrencyService = adminCurrencyService;
    }

    @GetMapping("/summary")
    public ResponseEntity<CurrencySummaryDTO> summary() {
        return ResponseEntity.ok(adminCurrencyService.getSummary());
    }

    @GetMapping("/currencies")
    public ResponseEntity<List<CurrencyResponseDTO>> currencies() {
        return ResponseEntity.ok(adminCurrencyService.findAllCurrencies());
    }

    @PostMapping("/currencies")
    public ResponseEntity<CurrencyResponseDTO> createCurrency(
            @Valid @RequestBody CreateCurrencyRequestDTO request,
            Authentication authentication
    ) {
        CurrencyResponseDTO response = adminCurrencyService.createCurrency(request, authentication);
        return ResponseEntity.status(HttpStatus.CREATED).body(response);
    }

    @GetMapping("/currencies/{id}")
    public ResponseEntity<CurrencyResponseDTO> currencyById(
            @PathVariable Long id,
            Authentication authentication
    ) {
        return ResponseEntity.ok(adminCurrencyService.findCurrencyById(id, authentication));
    }

    @PatchMapping("/currencies/{id}/status")
    public ResponseEntity<CurrencyResponseDTO> changeStatus(
            @PathVariable Long id,
            @Valid @RequestBody ChangeCurrencyStatusRequestDTO request,
            Authentication authentication
    ) {
        return ResponseEntity.ok(adminCurrencyService.changeStatus(id, request.status(), authentication));
    }

    @GetMapping("/currencies/{id}/history")
    public ResponseEntity<List<ExchangeRateHistoryDTO>> currencyHistory(
            @PathVariable Long id,
            Authentication authentication
    ) {
        return ResponseEntity.ok(adminCurrencyService.findHistoryForCurrency(id, authentication));
    }

    @GetMapping("/corridors")
    public ResponseEntity<List<CorridorResponseDTO>> corridors(Authentication authentication) {
        return ResponseEntity.ok(adminCurrencyService.findAllCorridors(authentication));
    }

    @GetMapping("/rate-history")
    public ResponseEntity<List<ExchangeRateHistoryDTO>> rateHistory(Authentication authentication) {
        return ResponseEntity.ok(adminCurrencyService.findRateHistory(authentication));
    }
}
