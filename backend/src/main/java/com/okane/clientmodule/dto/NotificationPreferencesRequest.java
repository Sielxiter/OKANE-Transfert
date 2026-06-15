package com.okane.clientmodule.dto;

public record NotificationPreferencesRequest(
        boolean emailNotificationsEnabled,
        boolean smsNotificationsEnabled
) {
}
