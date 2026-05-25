package com.okane.agent.dto;

public record NotificationPreferencesResponse(
        boolean transferPaid,
        boolean cashSession,
        boolean systemAlerts,
        boolean kycAlerts,
        boolean cashDiscrepancy
) {
}
