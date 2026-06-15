package com.okane.agencymanagement.controller;

import com.okane.agencymanagement.dto.AgencyResponseDTO;
import com.okane.agencymanagement.dto.AssignManagerRequestDTO;
import com.okane.agencymanagement.dto.ChangeAgencyStatusRequestDTO;
import com.okane.agencymanagement.dto.CreateAgencyRequestDTO;
import com.okane.agencymanagement.dto.UpdateAgencyRequestDTO;
import com.okane.agencymanagement.service.CentralAgencyService;
import jakarta.validation.Valid;
import java.util.List;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@Validated
@RequestMapping("/api/admin/central-agencies")
@PreAuthorize("hasRole('ADMIN')")
public class AdminCentralAgencyController {

    private final CentralAgencyService centralAgencyService;

    public AdminCentralAgencyController(CentralAgencyService centralAgencyService) {
        this.centralAgencyService = centralAgencyService;
    }

    @GetMapping
    public ResponseEntity<List<AgencyResponseDTO>> getAllCentralAgencies() {
        return ResponseEntity.ok(centralAgencyService.getAllCentralAgencies());
    }

    @GetMapping("/{id}")
    public ResponseEntity<AgencyResponseDTO> getCentralAgencyById(@PathVariable Long id) {
        return ResponseEntity.ok(centralAgencyService.getCentralAgencyById(id));
    }

    @PostMapping
    public ResponseEntity<AgencyResponseDTO> createCentralAgency(
            @Valid @RequestBody CreateAgencyRequestDTO request,
            Authentication authentication
    ) {
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(centralAgencyService.createCentralAgency(request, authentication));
    }

    @PutMapping("/{id}")
    public ResponseEntity<AgencyResponseDTO> updateCentralAgency(
            @PathVariable Long id,
            @Valid @RequestBody UpdateAgencyRequestDTO request,
            Authentication authentication
    ) {
        return ResponseEntity.ok(centralAgencyService.updateCentralAgency(id, request, authentication));
    }

    @PatchMapping("/{id}/status")
    public ResponseEntity<AgencyResponseDTO> changeStatus(
            @PathVariable Long id,
            @Valid @RequestBody ChangeAgencyStatusRequestDTO request,
            Authentication authentication
    ) {
        return ResponseEntity.ok(centralAgencyService.changeStatus(id, request, authentication));
    }

    @PatchMapping("/{id}/manager")
    public ResponseEntity<AgencyResponseDTO> assignManager(
            @PathVariable Long id,
            @Valid @RequestBody AssignManagerRequestDTO request,
            Authentication authentication
    ) {
        return ResponseEntity.ok(centralAgencyService.assignManager(id, request, authentication));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<AgencyResponseDTO> disableCentralAgency(
            @PathVariable Long id,
            Authentication authentication
    ) {
        return ResponseEntity.ok(centralAgencyService.disableCentralAgency(id, authentication));
    }
}
