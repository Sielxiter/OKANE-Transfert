package com.okane.managermodule.controller;

import com.okane.managermodule.dto.CashClosureListDto;
import com.okane.managermodule.service.ManagerCashService;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@Validated
@RequestMapping("/api/manager/cash")
@PreAuthorize("hasAnyRole('ADMIN', 'MANAGER')")
public class ManagerCashController {

    private final ManagerCashService managerCashService;

    public ManagerCashController(ManagerCashService managerCashService) {
        this.managerCashService = managerCashService;
    }

    @GetMapping("/closures")
    public ResponseEntity<List<CashClosureListDto>> getCashClosures(Authentication authentication) {
        return ResponseEntity.ok(managerCashService.getCashClosures(authentication));
    }

    @GetMapping("/closures/{id}")
    public ResponseEntity<CashClosureListDto> getCashClosureDetails(@PathVariable Long id, Authentication authentication) {
        return ResponseEntity.ok(managerCashService.getCashClosureDetails(id, authentication));
    }

    @PostMapping("/closures/{id}/validate")
    public ResponseEntity<Void> validateCashClosure(@PathVariable Long id, Authentication authentication) {
        managerCashService.validateCashClosure(id, authentication);
        return ResponseEntity.ok().build();
    }
}
