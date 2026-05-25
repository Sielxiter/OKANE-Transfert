package com.okane.agent.dto;

public record AgentProfileResponse(
        Long id,
        String fullName,
        String email,
        String agencyName,
        String role,
        String preferredLanguage,
        NotificationPreferencesResponse notificationPreferences
) {
}
