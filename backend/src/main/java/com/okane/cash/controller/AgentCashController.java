package com.okane.cash.controller;

import com.okane.cash.dto.CashMovementResponse;
import com.okane.cash.dto.CashSessionResponse;
import com.okane.cash.dto.CloseCashSessionRequest;
import com.okane.cash.dto.OpenCashSessionRequest;
import com.okane.cash.service.AgentCashService;
import jakarta.validation.Valid;
import java.util.List;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@Validated
@RequestMapping("/api/agent/cash")
public class AgentCashController {

    private final AgentCashService cashService;

    public AgentCashController(AgentCashService cashService) {
        this.cashService = cashService;
    }

    @GetMapping("/session")
    public ResponseEntity<CashSessionResponse> getSession(Authentication authentication) {
        return ResponseEntity.ok(cashService.getCurrentSession(authentication));
    }

    @GetMapping("/movements")
    public ResponseEntity<List<CashMovementResponse>> getMovements(Authentication authentication) {
        return ResponseEntity.ok(cashService.getMovements(authentication));
    }

    @PostMapping("/session/open")
    public ResponseEntity<CashSessionResponse> openSession(
            @Valid @RequestBody OpenCashSessionRequest request,
            Authentication authentication
    ) {
        return ResponseEntity.ok(cashService.openSession(authentication, request));
    }

    @PostMapping("/session/close")
    public ResponseEntity<CashSessionResponse> closeSession(
            @Valid @RequestBody CloseCashSessionRequest request,
            Authentication authentication
    ) {
        return ResponseEntity.ok(cashService.closeSession(authentication, request));
    }
}
