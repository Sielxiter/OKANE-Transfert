package com.okane.managermodule.controller;

import com.okane.managermodule.dto.AgentListDto;
import com.okane.managermodule.service.ManagerAgentService;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;
import java.util.Map;

@RestController
@Validated
@RequestMapping("/api/manager/agents")
@PreAuthorize("hasAnyRole('ADMIN', 'MANAGER')")
public class ManagerAgentController {

    private final ManagerAgentService managerAgentService;

    public ManagerAgentController(ManagerAgentService managerAgentService) {
        this.managerAgentService = managerAgentService;
    }

    @GetMapping
    public ResponseEntity<List<AgentListDto>> getAgents(Authentication authentication) {
        return ResponseEntity.ok(managerAgentService.getAgents(authentication));
    }

    @GetMapping("/{id}")
    public ResponseEntity<AgentListDto> getAgentById(@PathVariable Long id, Authentication authentication) {
        return ResponseEntity.ok(managerAgentService.getAgentById(id, authentication));
    }

    @PatchMapping("/{id}/status")
    public ResponseEntity<Void> changeAgentStatus(@PathVariable Long id, @RequestBody Map<String, String> payload, Authentication authentication) {
        managerAgentService.changeAgentStatus(id, payload.get("status"), authentication);
        return ResponseEntity.ok().build();
    }
}
