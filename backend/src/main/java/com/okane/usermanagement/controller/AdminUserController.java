package com.okane.usermanagement.controller;

import com.okane.usermanagement.dto.ChangeUserStatusRequestDTO;
import com.okane.usermanagement.dto.CreateUserRequestDTO;
import com.okane.usermanagement.dto.UpdateUserRequestDTO;
import com.okane.usermanagement.dto.UserResponseDTO;
import com.okane.usermanagement.service.UserManagementService;
import jakarta.validation.Valid;
import java.util.List;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

/**
 * Admin endpoints for managing users (clients, admins, managers, agents).
 * <p>
 * Path-based protection is already enforced in {@code SecurityConfig} via
 * {@code /api/admin/** -> hasRole("ADMIN")}. The {@code @PreAuthorize}
 * annotations below add a defense-in-depth layer at the method level and make
 * the access policy visible from the controller itself.
 */
@RestController
@Validated
@RequestMapping("/api/admin/users")
@PreAuthorize("hasRole('ADMIN')")
public class AdminUserController {

    private final UserManagementService userManagementService;

    public AdminUserController(UserManagementService userManagementService) {
        this.userManagementService = userManagementService;
    }

    @GetMapping("/clients")
    public ResponseEntity<List<UserResponseDTO>> getClients() {
        return ResponseEntity.ok(userManagementService.getClients());
    }

    @GetMapping("/admins")
    public ResponseEntity<List<UserResponseDTO>> getAdmins() {
        return ResponseEntity.ok(userManagementService.getAdmins());
    }

    @GetMapping("/managers")
    public ResponseEntity<List<UserResponseDTO>> getManagers() {
        return ResponseEntity.ok(userManagementService.getManagers());
    }

    @GetMapping("/agents")
    public ResponseEntity<List<UserResponseDTO>> getAgents() {
        return ResponseEntity.ok(userManagementService.getAgents());
    }

    @GetMapping("/{id}")
    public ResponseEntity<UserResponseDTO> getById(@PathVariable Long id) {
        return ResponseEntity.ok(userManagementService.getUserById(id));
    }

    @PostMapping
    public ResponseEntity<UserResponseDTO> createUser(
            @Valid @RequestBody CreateUserRequestDTO request,
            Authentication authentication
    ) {
        UserResponseDTO response = userManagementService.createUser(request, authentication);
        return ResponseEntity.status(HttpStatus.CREATED).body(response);
    }

    @PutMapping("/{id}")
    public ResponseEntity<UserResponseDTO> updateUser(
            @PathVariable Long id,
            @Valid @RequestBody UpdateUserRequestDTO request,
            Authentication authentication
    ) {
        return ResponseEntity.ok(userManagementService.updateUser(id, request, authentication));
    }

    @PatchMapping("/{id}/status")
    public ResponseEntity<UserResponseDTO> changeStatus(
            @PathVariable Long id,
            @Valid @RequestBody ChangeUserStatusRequestDTO request,
            Authentication authentication
    ) {
        return ResponseEntity.ok(userManagementService.changeStatus(id, request, authentication));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<UserResponseDTO> disableUser(
            @PathVariable Long id,
            Authentication authentication
    ) {
        return ResponseEntity.ok(userManagementService.disableUser(id, authentication));
    }
}
