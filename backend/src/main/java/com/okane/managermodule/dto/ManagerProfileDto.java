package com.okane.managermodule.dto;

import java.time.LocalDateTime;

public record ManagerProfileDto(
        Long id,
        String firstName,
        String lastName,
        String fullName,
        String email,
        String phone,
        String role,
        String centralAgencyName,
        String centralAgencyCode,
        Long centralAgencyId,
        long subAgencyCount,
        long totalAgentCount,
        LocalDateTime lastLoginAt,
        LocalDateTime createdAt
) {}
