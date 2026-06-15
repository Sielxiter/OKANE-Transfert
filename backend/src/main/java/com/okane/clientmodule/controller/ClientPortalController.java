package com.okane.clientmodule.controller;

import com.okane.clientmodule.dto.ChangePasswordRequest;
import com.okane.clientmodule.dto.ClientDashboardSummaryDTO;
import com.okane.clientmodule.dto.ClientNotificationDTO;
import com.okane.clientmodule.dto.ClientProfileDTO;
import com.okane.clientmodule.dto.ClientTrackTransferDTO;
import com.okane.clientmodule.dto.ClientTransferDetailsDTO;
import com.okane.clientmodule.dto.ClientTransferListItemDTO;
import com.okane.clientmodule.dto.ClientTransferReceiptDTO;
import com.okane.clientmodule.dto.NotificationPreferencesRequest;
import com.okane.clientmodule.dto.UpdateClientProfileRequest;
import com.okane.clientmodule.service.ClientPortalService;
import jakarta.validation.Valid;
import java.util.Map;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/client")
@PreAuthorize("hasRole('CLIENT')")
public class ClientPortalController {

    private final ClientPortalService clientPortalService;

    public ClientPortalController(ClientPortalService clientPortalService) {
        this.clientPortalService = clientPortalService;
    }

    @GetMapping("/dashboard/summary")
    public ResponseEntity<ClientDashboardSummaryDTO> summary(Authentication authentication) {
        return ResponseEntity.ok(clientPortalService.getSummary(authentication));
    }

    @GetMapping("/transfers")
    public ResponseEntity<Page<ClientTransferListItemDTO>> transfers(
            Authentication authentication,
            @RequestParam(required = false) String status,
            @RequestParam(required = false) String fromDate,
            @RequestParam(required = false) String toDate,
            @RequestParam(required = false) String reference,
            Pageable pageable
    ) {
        return ResponseEntity.ok(clientPortalService.getTransfers(authentication, status, fromDate, toDate, reference, pageable));
    }

    @GetMapping("/transfers/{reference}")
    public ResponseEntity<ClientTransferDetailsDTO> transferDetails(Authentication authentication, @PathVariable String reference) {
        return ResponseEntity.ok(clientPortalService.getTransferDetails(authentication, reference));
    }

    @GetMapping("/transfers/{reference}/receipt")
    public ResponseEntity<ClientTransferReceiptDTO> receipt(Authentication authentication, @PathVariable String reference) {
        return ResponseEntity.ok(clientPortalService.getReceipt(authentication, reference));
    }

    @GetMapping("/transfers/track")
    public ResponseEntity<ClientTrackTransferDTO> track(Authentication authentication, @RequestParam String reference) {
        return ResponseEntity.ok(clientPortalService.trackTransfer(authentication, reference));
    }

    @GetMapping("/notifications")
    public ResponseEntity<Page<ClientNotificationDTO>> notifications(
            Authentication authentication,
            @RequestParam(required = false) Boolean read,
            @RequestParam(required = false) String type,
            Pageable pageable
    ) {
        return ResponseEntity.ok(clientPortalService.getNotifications(authentication, read, type, pageable));
    }

    @GetMapping("/notifications/unread-count")
    public ResponseEntity<Map<String, Long>> unreadCount(Authentication authentication) {
        return ResponseEntity.ok(Map.of("unreadCount", clientPortalService.getUnreadCount(authentication)));
    }

    @PatchMapping("/notifications/{id}/read")
    public ResponseEntity<Void> markAsRead(Authentication authentication, @PathVariable Long id) {
        clientPortalService.markNotificationRead(authentication, id);
        return ResponseEntity.noContent().build();
    }

    @PatchMapping("/notifications/read-all")
    public ResponseEntity<Void> markAllAsRead(Authentication authentication) {
        clientPortalService.markAllNotificationsRead(authentication);
        return ResponseEntity.noContent().build();
    }

    @DeleteMapping("/notifications/{id}")
    public ResponseEntity<Void> delete(Authentication authentication, @PathVariable Long id) {
        clientPortalService.deleteNotification(authentication, id);
        return ResponseEntity.noContent().build();
    }

    @GetMapping("/profile")
    public ResponseEntity<ClientProfileDTO> profile(Authentication authentication) {
        return ResponseEntity.ok(clientPortalService.getProfile(authentication));
    }

    @PutMapping("/profile")
    public ResponseEntity<ClientProfileDTO> updateProfile(
            Authentication authentication,
            @Valid @RequestBody UpdateClientProfileRequest request
    ) {
        return ResponseEntity.ok(clientPortalService.updateProfile(authentication, request));
    }

    @PutMapping("/profile/password")
    public ResponseEntity<Map<String, String>> changePassword(
            Authentication authentication,
            @Valid @RequestBody ChangePasswordRequest request
    ) {
        clientPortalService.changePassword(authentication, request);
        return ResponseEntity.ok(Map.of("message", "Mot de passe modifie avec succes."));
    }

    @PutMapping("/profile/notification-preferences")
    public ResponseEntity<ClientProfileDTO> updateNotificationPreferences(
            Authentication authentication,
            @Valid @RequestBody NotificationPreferencesRequest request
    ) {
        return ResponseEntity.ok(clientPortalService.updateNotificationPreferences(authentication, request));
    }
}
