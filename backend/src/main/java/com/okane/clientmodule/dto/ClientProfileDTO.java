package com.okane.clientmodule.dto;

public record ClientProfileDTO(
        Long id,
        String firstName,
        String lastName,
        String email,
        String phone,
        String country,
        String preferredLanguage,
        boolean emailNotificationsEnabled,
        boolean smsNotificationsEnabled,
        String kycStatus,
        String amlRiskLevel
) {
}
