package com.okane.clientmodule.dto;

import java.time.LocalDateTime;

public record ClientNotificationDTO(
        Long id,
        String title,
        String message,
        String type,
        boolean read,
        LocalDateTime createdAt,
        String transferReference
) {
}
