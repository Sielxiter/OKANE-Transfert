package com.okane.agencybalance.controller;

import com.okane.agencybalance.dto.AgencyBalanceDetailDto;
import com.okane.agencybalance.dto.AgencyBalanceDto;
import com.okane.agencybalance.dto.CashMovementDto;
import com.okane.agencybalance.dto.FundAgencyRequestDto;
import com.okane.agencybalance.service.AgencyBalanceService;
import jakarta.validation.Valid;
import java.time.LocalDate;
import java.util.List;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@RestController
@Validated
@RequestMapping("/api/admin/agency-balances")
@PreAuthorize("hasRole('ADMIN')")
public class AgencyBalanceController {

    private final AgencyBalanceService agencyBalanceService;

    public AgencyBalanceController(AgencyBalanceService agencyBalanceService) {
        this.agencyBalanceService = agencyBalanceService;
    }

    @GetMapping
    public ResponseEntity<List<AgencyBalanceDto>> listAll() {
        return ResponseEntity.ok(agencyBalanceService.listAllAgencyBalances());
    }

    @GetMapping("/{id}")
    public ResponseEntity<AgencyBalanceDetailDto> getDetails(@PathVariable Long id) {
        return ResponseEntity.ok(agencyBalanceService.getAgencyBalanceDetails(id));
    }

    @PostMapping("/{id}/fund")
    public ResponseEntity<Void> fund(
            @PathVariable Long id,
            @Valid @RequestBody FundAgencyRequestDto request,
            Authentication authentication) {
        agencyBalanceService.fundAgency(id, request, authentication.getName());
        return ResponseEntity.ok().build();
    }

    @PostMapping("/{id}/withdraw")
    public ResponseEntity<Void> withdraw(
            @PathVariable Long id,
            @Valid @RequestBody FundAgencyRequestDto request,
            Authentication authentication) {
        agencyBalanceService.withdrawFromAgency(id, request, authentication.getName());
        return ResponseEntity.ok().build();
    }

    @GetMapping("/{id}/movements")
    public ResponseEntity<List<CashMovementDto>> getMovements(
            @PathVariable Long id,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate from,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate to) {
        return ResponseEntity.ok(agencyBalanceService.getMovements(id, from, to));
    }
}
