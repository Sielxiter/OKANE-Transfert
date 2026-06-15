package com.okane.transfermanagement.controller;

import com.okane.transfermanagement.dto.AgentCountryResponseDTO;
import com.okane.transfermanagement.dto.AgentCurrencyResponseDTO;
import com.okane.transfermanagement.dto.AgentTransferQuoteRequestDTO;
import com.okane.transfermanagement.dto.AgentTransferQuoteResponseDTO;
import com.okane.transfermanagement.dto.AgentTransferResponseDTO;
import com.okane.transfermanagement.dto.CreateAgentTransferRequestDTO;
import com.okane.transfermanagement.service.AgentTransferService;
import jakarta.validation.Valid;
import java.util.List;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/agent")
@PreAuthorize("hasAnyRole('ADMIN', 'MANAGER', 'AGENT')")
public class AgentTransferController {

    private final AgentTransferService agentTransferService;

    public AgentTransferController(AgentTransferService agentTransferService) {
        this.agentTransferService = agentTransferService;
    }

    @GetMapping("/countries")
    public ResponseEntity<List<AgentCountryResponseDTO>> countries() {
        return ResponseEntity.ok(agentTransferService.findCountries());
    }

    @GetMapping("/currencies")
    public ResponseEntity<List<AgentCurrencyResponseDTO>> currencies() {
        return ResponseEntity.ok(agentTransferService.findCurrencies());
    }

    @PostMapping("/transfers/quote")
    public ResponseEntity<AgentTransferQuoteResponseDTO> quote(@Valid @RequestBody AgentTransferQuoteRequestDTO request) {
        return ResponseEntity.ok(agentTransferService.quote(request));
    }

    @PostMapping("/transfers")
    public ResponseEntity<AgentTransferResponseDTO> create(
            @Valid @RequestBody CreateAgentTransferRequestDTO request,
            Authentication authentication
    ) {
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(agentTransferService.createTransfer(request, authentication));
    }
}
