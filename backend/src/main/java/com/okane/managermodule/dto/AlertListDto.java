package com.okane.managermodule.dto;

import java.time.LocalDateTime;

public record AlertListDto(
        Long id,
        String type,
        String severity,
        String title,
        String description,
        String status,
        Long relatedEntityId,
        String relatedEntityType,
        LocalDateTime createdAt,
        LocalDateTime resolvedAt
) {}
