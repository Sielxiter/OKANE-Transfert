package com.okane.transfermanagement.controller;

import com.okane.transfermanagement.domain.TransferStatus;
import com.okane.transfermanagement.dto.TransferFilterDTO;
import com.okane.transfermanagement.dto.TransferResponseDTO;
import com.okane.transfermanagement.service.AdminTransferService;
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
 * Admin endpoints for supervising transfers.
 *
 * <p>Path-level protection is already enforced in {@code SecurityConfig}
 * ({@code /api/admin/** -> hasRole("ADMIN")}). The {@code @PreAuthorize}
 * annotation here adds a method-level guard so the contract is visible from
 * the controller.
 */
@RestController
@RequestMapping("/api/admin/transfers")
@PreAuthorize("hasRole('ADMIN')")
public class AdminTransferController {

    private final AdminTransferService adminTransferService;

    public AdminTransferController(AdminTransferService adminTransferService) {
        this.adminTransferService = adminTransferService;
    }

    @GetMapping
    public ResponseEntity<List<TransferResponseDTO>> list(
            @RequestParam(value = "search", required = false) String search,
            @RequestParam(value = "status", required = false) TransferStatus status,
            @RequestParam(value = "currency", required = false) String currency,
            @RequestParam(value = "sourceCountry", required = false) String sourceCountry,
            @RequestParam(value = "destinationCountry", required = false) String destinationCountry,
            @RequestParam(value = "agentId", required = false) Long agentId,
            @RequestParam(value = "dateFrom", required = false)
            @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate dateFrom,
            @RequestParam(value = "dateTo", required = false)
            @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate dateTo
    ) {
        TransferFilterDTO filter = new TransferFilterDTO(
                search,
                status,
                currency,
                sourceCountry,
                destinationCountry,
                agentId,
                dateFrom,
                dateTo
        );
        return ResponseEntity.ok(adminTransferService.findAll(filter));
    }

    @GetMapping("/{id}")
    public ResponseEntity<TransferResponseDTO> getById(
            @PathVariable Long id,
            Authentication authentication
    ) {
        return ResponseEntity.ok(adminTransferService.findById(id, authentication));
    }

    @PatchMapping("/{id}/suspect")
    public ResponseEntity<TransferResponseDTO> markSuspect(
            @PathVariable Long id,
            Authentication authentication
    ) {
        return ResponseEntity.ok(adminTransferService.markSuspect(id, authentication));
    }

    @PatchMapping("/{id}/cancel")
    public ResponseEntity<TransferResponseDTO> cancel(
            @PathVariable Long id,
            Authentication authentication
    ) {
        return ResponseEntity.ok(adminTransferService.cancel(id, authentication));
    }
}
