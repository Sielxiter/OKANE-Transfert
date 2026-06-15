package com.okane.feemanagement.controller;

import com.okane.feemanagement.dto.CreateTariffLineRequestDTO;
import com.okane.feemanagement.dto.TariffLineResponseDTO;
import com.okane.feemanagement.dto.TariffSimulationRequestDTO;
import com.okane.feemanagement.dto.TariffSimulationResponseDTO;
import com.okane.feemanagement.dto.TariffSummaryDTO;
import com.okane.feemanagement.dto.UpdateTariffLineRequestDTO;
import com.okane.feemanagement.service.AdminFeeService;
import jakarta.validation.Valid;
import java.util.List;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/admin/fees")
@PreAuthorize("hasRole('ADMIN')")
public class AdminFeeController {

    private final AdminFeeService adminFeeService;

    public AdminFeeController(AdminFeeService adminFeeService) {
        this.adminFeeService = adminFeeService;
    }

    @GetMapping("/summary")
    public ResponseEntity<TariffSummaryDTO> summary() {
        return ResponseEntity.ok(adminFeeService.getSummary());
    }

    @GetMapping({"/tariffs", "/grids"})
    public ResponseEntity<List<TariffLineResponseDTO>> list() {
        return ResponseEntity.ok(adminFeeService.findAllLines());
    }

    @GetMapping({"/tariffs/{id}", "/grids/{id}"})
    public ResponseEntity<TariffLineResponseDTO> getById(@PathVariable Long id) {
        return ResponseEntity.ok(adminFeeService.findLineById(id));
    }

    @PostMapping({"/tariffs", "/grids"})
    public ResponseEntity<TariffLineResponseDTO> create(
            @Valid @RequestBody CreateTariffLineRequestDTO request,
            Authentication authentication
    ) {
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(adminFeeService.createLine(request, authentication));
    }

    @PutMapping({"/tariffs/{id}", "/grids/{id}"})
    public ResponseEntity<TariffLineResponseDTO> update(
            @PathVariable Long id,
            @Valid @RequestBody UpdateTariffLineRequestDTO request,
            Authentication authentication
    ) {
        return ResponseEntity.ok(adminFeeService.updateLine(id, request, authentication));
    }

    @DeleteMapping({"/tariffs/{id}", "/grids/{id}"})
    public ResponseEntity<Void> delete(@PathVariable Long id, Authentication authentication) {
        adminFeeService.deleteLine(id, authentication);
        return ResponseEntity.noContent().build();
    }

    @PostMapping("/simulate")
    public ResponseEntity<TariffSimulationResponseDTO> simulate(
            @Valid @RequestBody TariffSimulationRequestDTO request,
            Authentication authentication
    ) {
        return ResponseEntity.ok(adminFeeService.simulate(request, authentication));
    }
}
