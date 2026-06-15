package com.okane.managermodule.controller;

import com.okane.managermodule.dto.ValidationListDto;
import com.okane.managermodule.service.ManagerValidationService;
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
@RequestMapping("/api/manager/validations")
@PreAuthorize("hasAnyRole('ADMIN', 'MANAGER')")
public class ManagerValidationController {

    private final ManagerValidationService managerValidationService;

    public ManagerValidationController(ManagerValidationService managerValidationService) {
        this.managerValidationService = managerValidationService;
    }

    @GetMapping("/pending-count")
    public ResponseEntity<Long> getPendingCount(Authentication authentication) {
        return ResponseEntity.ok(managerValidationService.getPendingCount(authentication));
    }

    @GetMapping
    public ResponseEntity<List<ValidationListDto>> getValidations(Authentication authentication) {
        return ResponseEntity.ok(managerValidationService.getValidations(authentication));
    }

    @PostMapping("/{id}/approve")
    public ResponseEntity<Void> approveValidation(@PathVariable Long id, Authentication authentication) {
        managerValidationService.approveValidation(id, authentication);
        return ResponseEntity.ok().build();
    }

    @PostMapping("/{id}/reject")
    public ResponseEntity<Void> rejectValidation(@PathVariable Long id, Authentication authentication) {
        managerValidationService.rejectValidation(id, authentication);
        return ResponseEntity.ok().build();
    }
}
