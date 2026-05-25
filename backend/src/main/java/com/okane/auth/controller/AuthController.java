package com.okane.auth.controller;

import com.okane.auth.dto.AuthResponse;
import com.okane.auth.dto.ChangePasswordRequest;
import com.okane.auth.dto.LoginRequest;
import com.okane.auth.dto.LogoutRequest;
import com.okane.auth.dto.RefreshTokenRequest;
import com.okane.auth.dto.SimpleMessageResponse;
import com.okane.auth.dto.UserResponse;
import com.okane.auth.service.AuthService;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.validation.Valid;
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
@RequestMapping("/api/auth")
public class AuthController {

    private final AuthService authService;

    public AuthController(AuthService authService) {
        this.authService = authService;
    }

    @PostMapping("/login")
    public ResponseEntity<AuthResponse> login(
            @Valid @RequestBody LoginRequest request,
            HttpServletRequest httpServletRequest
    ) {
        return ResponseEntity.ok(authService.login(
                request,
                resolveIpAddress(httpServletRequest),
                resolveUserAgent(httpServletRequest)
        ));
    }

    @PostMapping("/refresh")
    public ResponseEntity<AuthResponse> refresh(
            @Valid @RequestBody RefreshTokenRequest request,
            HttpServletRequest httpServletRequest
    ) {
        return ResponseEntity.ok(authService.refresh(
                request,
                resolveIpAddress(httpServletRequest),
                resolveUserAgent(httpServletRequest)
        ));
    }

    @PostMapping("/logout")
    public ResponseEntity<SimpleMessageResponse> logout(
            @Valid @RequestBody LogoutRequest request,
            HttpServletRequest httpServletRequest
    ) {
        return ResponseEntity.ok(authService.logout(
                request,
                resolveIpAddress(httpServletRequest),
                resolveUserAgent(httpServletRequest)
        ));
    }

    @PostMapping("/change-password")
    public ResponseEntity<SimpleMessageResponse> changePassword(
            @Valid @RequestBody ChangePasswordRequest request,
            Authentication authentication,
            HttpServletRequest httpServletRequest
    ) {
        return ResponseEntity.ok(authService.changePassword(
                request,
                authentication,
                resolveIpAddress(httpServletRequest),
                resolveUserAgent(httpServletRequest)
        ));
    }

    @GetMapping("/me")
    public ResponseEntity<UserResponse> me(Authentication authentication) {
        return ResponseEntity.ok(authService.getCurrentUser(authentication));
    }

    private String resolveIpAddress(HttpServletRequest request) {
        String forwardedFor = request.getHeader("X-Forwarded-For");
        if (forwardedFor != null && !forwardedFor.isBlank()) {
            return forwardedFor.split(",")[0].trim();
        }
        return request.getRemoteAddr();
    }

    private String resolveUserAgent(HttpServletRequest request) {
        return request.getHeader("User-Agent");
    }
}
