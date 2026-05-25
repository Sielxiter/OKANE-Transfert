package com.okane.agent.dto;

public record AgentNotificationResponse(
        String id,
        String title,
        String message,
        String type,
        String status,
        String referenceCode,
        String createdAt
) {
}
