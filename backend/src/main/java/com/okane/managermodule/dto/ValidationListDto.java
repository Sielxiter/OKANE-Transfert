package com.okane.managermodule.dto;

import java.time.LocalDateTime;

public record ValidationListDto(
        Long id,
        String type,
        String reference,
        String description,
        String requesterName,
        String requesterRole,
        String status,
        LocalDateTime requestedAt,
        Long relatedEntityId,
        String relatedEntityType
) {}
