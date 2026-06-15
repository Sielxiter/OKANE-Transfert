package com.okane.managermodule.dto;

import java.time.LocalDateTime;

public record AuditLogDto(
        Long id,
        String createdAt,
        String actorName,
        String actorEmail,
        String actorRole,
        String action,
        String module,
        String target,
        String ipAddress,
        String status,
        String riskLevel,
        String description
) {}
