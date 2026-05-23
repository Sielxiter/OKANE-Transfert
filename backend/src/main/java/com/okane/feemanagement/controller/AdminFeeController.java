package com.okane.feemanagement.controller;

import com.okane.feemanagement.dto.ChangeFeeGridStatusRequestDTO;
import com.okane.feemanagement.dto.CommissionResponseDTO;
import com.okane.feemanagement.dto.CreateFeeGridRequestDTO;
import com.okane.feemanagement.dto.FeeGridResponseDTO;
import com.okane.feemanagement.dto.FeeSimulationRequestDTO;
import com.okane.feemanagement.dto.FeeSimulationResponseDTO;
import com.okane.feemanagement.dto.FeeSummaryDTO;
import com.okane.feemanagement.service.AdminFeeService;
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
    public ResponseEntity<FeeSummaryDTO> summary() {
        return ResponseEntity.ok(adminFeeService.getSummary());
    }

    @GetMapping("/grids")
    public ResponseEntity<List<FeeGridResponseDTO>> grids() {
        return ResponseEntity.ok(adminFeeService.findAllGrids());
    }

    @GetMapping("/grids/{id}")
    public ResponseEntity<FeeGridResponseDTO> gridById(@PathVariable Long id) {
        return ResponseEntity.ok(adminFeeService.findGridById(id));
    }

    @PostMapping("/grids")
    public ResponseEntity<FeeGridResponseDTO> createGrid(
            @Valid @RequestBody CreateFeeGridRequestDTO request,
            Authentication authentication
    ) {
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(adminFeeService.createGrid(request, authentication));
    }

    @PutMapping("/grids/{id}")
    public ResponseEntity<FeeGridResponseDTO> updateGrid(
            @PathVariable Long id,
            @Valid @RequestBody CreateFeeGridRequestDTO request,
            Authentication authentication
    ) {
        return ResponseEntity.ok(adminFeeService.updateGrid(id, request, authentication));
    }

    @PatchMapping("/grids/{id}/status")
    public ResponseEntity<FeeGridResponseDTO> changeStatus(
            @PathVariable Long id,
            @Valid @RequestBody ChangeFeeGridStatusRequestDTO request,
            Authentication authentication
    ) {
        return ResponseEntity.ok(adminFeeService.changeStatus(id, request, authentication));
    }

    @PostMapping("/grids/{id}/duplicate")
    public ResponseEntity<FeeGridResponseDTO> duplicateGrid(
            @PathVariable Long id,
            Authentication authentication
    ) {
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(adminFeeService.duplicateGrid(id, authentication));
    }

    @PostMapping("/simulate")
    public ResponseEntity<FeeSimulationResponseDTO> simulate(
            @Valid @RequestBody FeeSimulationRequestDTO request,
            Authentication authentication
    ) {
        return ResponseEntity.ok(adminFeeService.simulate(request, authentication));
    }

    @GetMapping("/commissions")
    public ResponseEntity<List<CommissionResponseDTO>> commissions() {
        return ResponseEntity.ok(adminFeeService.findCommissionsBreakdown());
    }
}
