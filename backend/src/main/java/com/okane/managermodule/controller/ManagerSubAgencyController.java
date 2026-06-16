package com.okane.managermodule.controller;

import com.okane.managermodule.dto.AgentAssignableDto;
import com.okane.managermodule.dto.AssignAgentsRequest;
import com.okane.managermodule.dto.SubAgencyDetailsDto;
import com.okane.managermodule.dto.SubAgencyListDto;
import com.okane.managermodule.dto.UpdateDailyLimitRequest;
import com.okane.managermodule.service.ManagerSubAgencyService;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@Validated
@RequestMapping("/api/manager/subagencies")
@PreAuthorize("hasAnyRole('ADMIN', 'MANAGER')")
public class ManagerSubAgencyController {

    private final ManagerSubAgencyService managerSubAgencyService;

    public ManagerSubAgencyController(ManagerSubAgencyService managerSubAgencyService) {
        this.managerSubAgencyService = managerSubAgencyService;
    }

    @GetMapping
    public ResponseEntity<List<SubAgencyListDto>> getSubAgencies(Authentication authentication) {
        return ResponseEntity.ok(managerSubAgencyService.getSubAgencies(authentication));
    }

    @GetMapping("/{id}")
    public ResponseEntity<SubAgencyDetailsDto> getSubAgencyDetails(@PathVariable Long id, Authentication authentication) {
        return ResponseEntity.ok(managerSubAgencyService.getSubAgencyDetails(id, authentication));
    }

    @PutMapping("/{id}/limit")
    public ResponseEntity<Void> updateDailyLimit(
            @PathVariable Long id,
            @RequestBody UpdateDailyLimitRequest request,
            Authentication authentication) {
        managerSubAgencyService.updateDailyLimit(id, request.dailyLimit(), authentication);
        return ResponseEntity.ok().build();
    }

    @GetMapping("/{id}/agents/assignable")
    public ResponseEntity<List<AgentAssignableDto>> getAssignableAgents(
            @PathVariable Long id,
            Authentication authentication) {
        return ResponseEntity.ok(managerSubAgencyService.getAssignableAgents(id, authentication));
    }

    @PostMapping("/{id}/agents")
    public ResponseEntity<Void> assignAgents(
            @PathVariable Long id,
            @RequestBody AssignAgentsRequest request,
            Authentication authentication) {
        managerSubAgencyService.assignAgents(id, request.agentIds(), authentication);
        return ResponseEntity.ok().build();
    }
}
