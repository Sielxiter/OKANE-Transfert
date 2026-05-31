package com.okane.manager.controller;

import com.okane.manager.dto.ManagerAgentRequest;
import com.okane.manager.dto.ManagerAgentResponse;
import com.okane.manager.dto.ManagerAgentUpdateRequest;
import com.okane.manager.service.ManagerAgentManagementService;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/manager/agents")
public class ManagerAgentManagementController {

    private final ManagerAgentManagementService agentManagementService;

    public ManagerAgentManagementController(ManagerAgentManagementService agentManagementService) {
        this.agentManagementService = agentManagementService;
    }

    @GetMapping
    public ResponseEntity<List<ManagerAgentResponse>> getAgents(Authentication authentication) {
        return ResponseEntity.ok(agentManagementService.getAgents(authentication));
    }

    @GetMapping("/{agentId}")
    public ResponseEntity<ManagerAgentResponse> getAgent(
            @PathVariable Long agentId,
            Authentication authentication
    ) {
        return ResponseEntity.ok(agentManagementService.getAgent(authentication, agentId));
    }

    @PostMapping
    public ResponseEntity<ManagerAgentResponse> createAgent(
            @Valid @RequestBody ManagerAgentRequest request,
            Authentication authentication
    ) {
        ManagerAgentResponse response = agentManagementService.createAgent(authentication, request);
        return ResponseEntity.status(HttpStatus.CREATED).body(response);
    }

    @PutMapping("/{agentId}")
    public ResponseEntity<ManagerAgentResponse> updateAgent(
            @PathVariable Long agentId,
            @Valid @RequestBody ManagerAgentUpdateRequest request,
            Authentication authentication
    ) {
        return ResponseEntity.ok(agentManagementService.updateAgent(authentication, agentId, request));
    }

    @PatchMapping("/{agentId}/toggle-status")
    public ResponseEntity<ManagerAgentResponse> toggleAgentStatus(
            @PathVariable Long agentId,
            Authentication authentication
    ) {
        return ResponseEntity.ok(agentManagementService.toggleAgentStatus(authentication, agentId));
    }

    @DeleteMapping("/{agentId}")
    public ResponseEntity<Void> deleteAgent(
            @PathVariable Long agentId,
            Authentication authentication
    ) {
        agentManagementService.deleteAgent(authentication, agentId);
        return ResponseEntity.noContent().build();
    }
}
