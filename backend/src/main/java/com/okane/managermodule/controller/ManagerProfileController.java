package com.okane.managermodule.controller;

import com.okane.managermodule.dto.ManagerProfileDto;
import com.okane.managermodule.service.ManagerProfileService;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.Map;

@RestController
@Validated
@RequestMapping("/api/manager/profile")
@PreAuthorize("hasAnyRole('ADMIN', 'MANAGER')")
public class ManagerProfileController {

    private final ManagerProfileService managerProfileService;

    public ManagerProfileController(ManagerProfileService managerProfileService) {
        this.managerProfileService = managerProfileService;
    }

    @GetMapping
    public ResponseEntity<ManagerProfileDto> getProfile(Authentication authentication) {
        return ResponseEntity.ok(managerProfileService.getProfile(authentication));
    }

    @PutMapping
    public ResponseEntity<Void> updateProfile(@RequestBody Map<String, String> payload, Authentication authentication) {
        managerProfileService.updateProfile(
                payload.get("firstName"),
                payload.get("lastName"),
                payload.get("phone"),
                authentication
        );
        return ResponseEntity.ok().build();
    }

    @PostMapping("/change-password")
    public ResponseEntity<Void> changePassword(@RequestBody Map<String, String> payload, Authentication authentication) {
        managerProfileService.changePassword(
                payload.get("currentPassword"),
                payload.get("newPassword"),
                authentication
        );
        return ResponseEntity.ok().build();
    }
}
