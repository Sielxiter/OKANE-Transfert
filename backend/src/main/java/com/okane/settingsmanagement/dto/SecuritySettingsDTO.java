package com.okane.settingsmanagement.dto;

public class SecuritySettingsDTO {

    private boolean twoFactorEnabled;
    private int activeSessionsCount;
    private String lastLoginAt;
    private boolean securityAlertsEnabled;
    private String accessTokenDuration;
    private String refreshTokenDuration;
    private int maxLoginAttempts;
    private int bcryptStrength;

    public SecuritySettingsDTO() {
    }

    public boolean isTwoFactorEnabled() { return twoFactorEnabled; }
    public void setTwoFactorEnabled(boolean twoFactorEnabled) { this.twoFactorEnabled = twoFactorEnabled; }

    public int getActiveSessionsCount() { return activeSessionsCount; }
    public void setActiveSessionsCount(int activeSessionsCount) { this.activeSessionsCount = activeSessionsCount; }

    public String getLastLoginAt() { return lastLoginAt; }
    public void setLastLoginAt(String lastLoginAt) { this.lastLoginAt = lastLoginAt; }

    public boolean isSecurityAlertsEnabled() { return securityAlertsEnabled; }
    public void setSecurityAlertsEnabled(boolean securityAlertsEnabled) { this.securityAlertsEnabled = securityAlertsEnabled; }

    public String getAccessTokenDuration() { return accessTokenDuration; }
    public void setAccessTokenDuration(String accessTokenDuration) { this.accessTokenDuration = accessTokenDuration; }

    public String getRefreshTokenDuration() { return refreshTokenDuration; }
    public void setRefreshTokenDuration(String refreshTokenDuration) { this.refreshTokenDuration = refreshTokenDuration; }

    public int getMaxLoginAttempts() { return maxLoginAttempts; }
    public void setMaxLoginAttempts(int maxLoginAttempts) { this.maxLoginAttempts = maxLoginAttempts; }

    public int getBcryptStrength() { return bcryptStrength; }
    public void setBcryptStrength(int bcryptStrength) { this.bcryptStrength = bcryptStrength; }
}
