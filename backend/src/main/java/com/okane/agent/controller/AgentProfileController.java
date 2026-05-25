package com.okane.agent.controller;

import com.okane.agent.dto.AgentProfileResponse;
import com.okane.agent.dto.AgentProfileUpdateRequest;
import com.okane.agent.service.AgentProfileService;
import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@Validated
@RequestMapping("/api/agent/profile")
public class AgentProfileController {

    private final AgentProfileService profileService;

    public AgentProfileController(AgentProfileService profileService) {
        this.profileService = profileService;
    }

    @GetMapping
    public ResponseEntity<AgentProfileResponse> getProfile(Authentication authentication) {
        return ResponseEntity.ok(profileService.getProfile(authentication));
    }

    @PutMapping
    public ResponseEntity<AgentProfileResponse> updateProfile(
            @Valid @RequestBody AgentProfileUpdateRequest request,
            Authentication authentication
    ) {
        return ResponseEntity.ok(profileService.updateProfile(authentication, request));
    }
}
