package com.okane.manager.controller;

import com.okane.manager.dto.ManagerClientDetailResponse;
import com.okane.manager.dto.ManagerClientResponse;
import com.okane.manager.service.ManagerClientService;
import java.util.List;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/manager/clients")
public class ManagerClientController {

    private final ManagerClientService clientService;

    public ManagerClientController(ManagerClientService clientService) {
        this.clientService = clientService;
    }

    @GetMapping
    public ResponseEntity<List<ManagerClientResponse>> getClients(Authentication authentication) {
        return ResponseEntity.ok(clientService.getClients(authentication));
    }

    @GetMapping("/{clientId}")
    public ResponseEntity<ManagerClientDetailResponse> getClientDetail(
            @PathVariable Long clientId,
            Authentication authentication
    ) {
        return ResponseEntity.ok(clientService.getClientDetail(authentication, clientId));
    }
}