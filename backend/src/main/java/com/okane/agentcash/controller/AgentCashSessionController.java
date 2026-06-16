package com.okane.agentcash.controller;

import com.okane.agentcash.dto.AgentDashboardStatsDTO;
import com.okane.agentcash.dto.AgentSessionStatusDTO;
import com.okane.agentcash.dto.CloseSessionRequestDTO;
import com.okane.agentcash.dto.SessionCloseResultDTO;
import com.okane.agentcash.service.AgentCashSessionService;
import com.okane.cash.entity.CashMovement;
import jakarta.validation.Valid;
import java.util.List;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@Validated
@RequestMapping("/api/agent/cash-session")
@PreAuthorize("hasRole('AGENT')")
public class AgentCashSessionController {

    private final AgentCashSessionService agentCashSessionService;

    public AgentCashSessionController(AgentCashSessionService agentCashSessionService) {
        this.agentCashSessionService = agentCashSessionService;
    }

    @GetMapping("/status")
    public ResponseEntity<AgentSessionStatusDTO> getStatus(Authentication authentication) {
        return ResponseEntity.ok(agentCashSessionService.getSessionStatus(authentication.getName()));
    }

    @PostMapping("/open")
    public ResponseEntity<AgentSessionStatusDTO> openSession(Authentication authentication) {
        return ResponseEntity.ok(agentCashSessionService.openSession(authentication.getName()));
    }

    @PostMapping("/close")
    public ResponseEntity<SessionCloseResultDTO> closeSession(
            @Valid @RequestBody CloseSessionRequestDTO request,
            Authentication authentication) {
        return ResponseEntity.ok(agentCashSessionService.closeSession(authentication.getName(), request.actualBalance()));
    }

    @GetMapping("/movements")
    public ResponseEntity<List<CashMovement>> getMovements(Authentication authentication) {
        return ResponseEntity.ok(agentCashSessionService.getSessionMovements(authentication.getName()));
    }

    @GetMapping("/dashboard-stats")
    public ResponseEntity<AgentDashboardStatsDTO> getDashboardStats(Authentication authentication) {
        return ResponseEntity.ok(agentCashSessionService.getDashboardStats(authentication.getName()));
    }
}
