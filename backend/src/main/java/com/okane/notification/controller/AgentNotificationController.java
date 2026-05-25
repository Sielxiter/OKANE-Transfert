package com.okane.notification.controller;

import com.okane.agent.dto.AgentNotificationResponse;
import com.okane.auth.dto.SimpleMessageResponse;
import com.okane.notification.service.AgentNotificationService;
import java.util.List;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@Validated
@RequestMapping("/api/agent/notifications")
public class AgentNotificationController {

    private final AgentNotificationService notificationService;

    public AgentNotificationController(AgentNotificationService notificationService) {
        this.notificationService = notificationService;
    }

    @GetMapping
    public ResponseEntity<List<AgentNotificationResponse>> getNotifications(Authentication authentication) {
        return ResponseEntity.ok(notificationService.getNotifications(authentication));
    }

    @PostMapping("/{notificationId}/read")
    public ResponseEntity<SimpleMessageResponse> markAsRead(
            @PathVariable("notificationId") Long notificationId,
            Authentication authentication
    ) {
        notificationService.markAsRead(authentication, notificationId);
        return ResponseEntity.ok(new SimpleMessageResponse("Notification marquee comme lue."));
    }
}
