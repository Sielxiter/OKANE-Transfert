package com.okane.agencymanagement.controller;

import com.okane.agencymanagement.dto.AgencyResponseDTO;
import com.okane.agencymanagement.dto.AssignAgentRequestDTO;
import com.okane.agencymanagement.dto.AssignManagerRequestDTO;
import com.okane.agencymanagement.dto.ChangeAgencyStatusRequestDTO;
import com.okane.agencymanagement.dto.CreateAgencyRequestDTO;
import com.okane.agencymanagement.dto.UpdateAgencyRequestDTO;
import com.okane.agencymanagement.service.AgencyService;
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

/**
 * Admin endpoints for managing agencies, their managers and their agents.
 * <p>
 * {@code /api/admin/**} is already protected at the path level by
 * {@code SecurityConfig}. The {@code @PreAuthorize} annotation provides an
 * additional method-level guard so the contract is visible from the controller.
 */
@RestController
@Validated
@RequestMapping("/api/admin/agencies")
@PreAuthorize("hasRole('ADMIN')")
public class AdminAgencyController {

    private final AgencyService agencyService;

    public AdminAgencyController(AgencyService agencyService) {
        this.agencyService = agencyService;
    }

    @GetMapping
    public ResponseEntity<List<AgencyResponseDTO>> getAllAgencies() {
        return ResponseEntity.ok(agencyService.getAllAgencies());
    }

    @GetMapping("/{id}")
    public ResponseEntity<AgencyResponseDTO> getAgencyById(@PathVariable Long id) {
        return ResponseEntity.ok(agencyService.getAgencyById(id));
    }

    @PostMapping
    public ResponseEntity<AgencyResponseDTO> createAgency(
            @Valid @RequestBody CreateAgencyRequestDTO request,
            Authentication authentication
    ) {
        AgencyResponseDTO response = agencyService.createAgency(request, authentication);
        return ResponseEntity.status(HttpStatus.CREATED).body(response);
    }

    @PutMapping("/{id}")
    public ResponseEntity<AgencyResponseDTO> updateAgency(
            @PathVariable Long id,
            @Valid @RequestBody UpdateAgencyRequestDTO request,
            Authentication authentication
    ) {
        return ResponseEntity.ok(agencyService.updateAgency(id, request, authentication));
    }

    @PatchMapping("/{id}/status")
    public ResponseEntity<AgencyResponseDTO> changeAgencyStatus(
            @PathVariable Long id,
            @Valid @RequestBody ChangeAgencyStatusRequestDTO request,
            Authentication authentication
    ) {
        return ResponseEntity.ok(agencyService.changeAgencyStatus(id, request, authentication));
    }

    @PatchMapping("/{id}/manager")
    public ResponseEntity<AgencyResponseDTO> assignManager(
            @PathVariable Long id,
            @Valid @RequestBody AssignManagerRequestDTO request,
            Authentication authentication
    ) {
        return ResponseEntity.ok(agencyService.assignManager(id, request, authentication));
    }

    @PostMapping("/{id}/agents")
    public ResponseEntity<AgencyResponseDTO> assignAgent(
            @PathVariable Long id,
            @Valid @RequestBody AssignAgentRequestDTO request,
            Authentication authentication
    ) {
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(agencyService.assignAgent(id, request, authentication));
    }

    @DeleteMapping("/{id}/agents/{agentId}")
    public ResponseEntity<AgencyResponseDTO> removeAgent(
            @PathVariable Long id,
            @PathVariable Long agentId,
            Authentication authentication
    ) {
        return ResponseEntity.ok(agencyService.removeAgent(id, agentId, authentication));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<AgencyResponseDTO> disableAgency(
            @PathVariable Long id,
            Authentication authentication
    ) {
        return ResponseEntity.ok(agencyService.disableAgency(id, authentication));
    }
}
