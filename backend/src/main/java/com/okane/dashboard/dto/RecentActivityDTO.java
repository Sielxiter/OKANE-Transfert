package com.okane.dashboard.dto;

import java.time.LocalDateTime;

public record RecentActivityDTO(
        Long id,
        String type,
        String title,
        String description,
        String module,
        String actor,
        LocalDateTime createdAt
) {
}
