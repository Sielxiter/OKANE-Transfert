package com.okane.agent.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

public record AgentProfileUpdateRequest(
        @NotBlank String fullName,
        @NotBlank String preferredLanguage,
        @NotNull NotificationPreferencesResponse notificationPreferences
) {
}
