package com.okane.dashboard.dto;

import java.time.LocalDateTime;

public record SystemAlertDTO(
        String id,
        String title,
        String message,
        String severity,
        String category,
        LocalDateTime createdAt,
        String status
) {
}
