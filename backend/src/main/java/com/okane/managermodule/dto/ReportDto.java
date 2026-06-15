package com.okane.managermodule.dto;

import java.time.LocalDateTime;

public record ReportDto(
        Long id,
        String name,
        String type,
        String period,
        String agencyName,
        String format,
        String status,
        String filePath,
        LocalDateTime generatedAt,
        String generatedBy
) {}
