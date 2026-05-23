package com.okane.settingsmanagement.controller;

import com.okane.settingsmanagement.dto.AdminProfileDTO;
import com.okane.settingsmanagement.dto.AdminProfileUpdateDTO;
import com.okane.settingsmanagement.dto.NotificationSettingsDTO;
import com.okane.settingsmanagement.dto.PreferencesSettingsDTO;
import com.okane.settingsmanagement.dto.SecuritySettingsDTO;
import com.okane.settingsmanagement.dto.SecuritySettingsUpdateDTO;
import com.okane.settingsmanagement.dto.SystemSettingsDTO;
import com.okane.settingsmanagement.exception.SettingsNotFoundException;
import com.okane.settingsmanagement.service.AdminSettingsService;
import jakarta.validation.Valid;
import java.util.Map;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/admin/settings")
@PreAuthorize("hasRole('ADMIN')")
public class AdminSettingsController {

    private final AdminSettingsService settingsService;

    public AdminSettingsController(AdminSettingsService settingsService) {
        this.settingsService = settingsService;
    }

    // ─── Profile ────────────────────────────────────────────────────────────────

    @GetMapping("/profile")
    public ResponseEntity<?> getProfile() {
        try {
            return ResponseEntity.ok(settingsService.getProfile());
        } catch (SettingsNotFoundException e) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(Map.of("message", e.getMessage()));
        }
    }

    @PutMapping("/profile")
    public ResponseEntity<?> updateProfile(@Valid @RequestBody AdminProfileUpdateDTO request) {
        try {
            return ResponseEntity.ok(settingsService.updateProfile(request));
        } catch (SettingsNotFoundException e) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(Map.of("message", e.getMessage()));
        }
    }

    // ─── Security ────────────────────────────────────────────────────────────────

    @GetMapping("/security")
    public ResponseEntity<?> getSecurity() {
        try {
            return ResponseEntity.ok(settingsService.getSecurity());
        } catch (SettingsNotFoundException e) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(Map.of("message", e.getMessage()));
        }
    }

    @PutMapping("/security")
    public ResponseEntity<?> updateSecurity(@RequestBody SecuritySettingsUpdateDTO request) {
        try {
            return ResponseEntity.ok(settingsService.updateSecurity(request));
        } catch (SettingsNotFoundException e) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(Map.of("message", e.getMessage()));
        }
    }

    // ─── Notifications ───────────────────────────────────────────────────────────

    @GetMapping("/notifications")
    public ResponseEntity<?> getNotifications() {
        try {
            return ResponseEntity.ok(settingsService.getNotifications());
        } catch (SettingsNotFoundException e) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(Map.of("message", e.getMessage()));
        }
    }

    @PutMapping("/notifications")
    public ResponseEntity<?> updateNotifications(@RequestBody NotificationSettingsDTO request) {
        try {
            return ResponseEntity.ok(settingsService.updateNotifications(request));
        } catch (SettingsNotFoundException e) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(Map.of("message", e.getMessage()));
        }
    }

    // ─── Preferences ─────────────────────────────────────────────────────────────

    @GetMapping("/preferences")
    public ResponseEntity<?> getPreferences() {
        try {
            return ResponseEntity.ok(settingsService.getPreferences());
        } catch (SettingsNotFoundException e) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(Map.of("message", e.getMessage()));
        }
    }

    @PutMapping("/preferences")
    public ResponseEntity<?> updatePreferences(@RequestBody PreferencesSettingsDTO request) {
        try {
            return ResponseEntity.ok(settingsService.updatePreferences(request));
        } catch (SettingsNotFoundException e) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(Map.of("message", e.getMessage()));
        }
    }

    // ─── System ──────────────────────────────────────────────────────────────────

    @GetMapping("/system")
    public ResponseEntity<?> getSystemSettings() {
        try {
            return ResponseEntity.ok(settingsService.getSystemSettings());
        } catch (SettingsNotFoundException e) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(Map.of("message", e.getMessage()));
        }
    }

    @PutMapping("/system")
    public ResponseEntity<?> updateSystemSettings(@RequestBody SystemSettingsDTO request) {
        try {
            return ResponseEntity.ok(settingsService.updateSystemSettings(request));
        } catch (SettingsNotFoundException e) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(Map.of("message", e.getMessage()));
        }
    }
}
