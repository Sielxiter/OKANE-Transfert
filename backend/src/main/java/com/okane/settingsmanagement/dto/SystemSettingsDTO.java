package com.okane.settingsmanagement.dto;

public class SystemSettingsDTO {

    private String accessTokenDuration;
    private String refreshTokenDuration;
    private int maxLoginAttempts;
    private int bcryptStrength;
    private boolean maintenanceMode;

    public SystemSettingsDTO() {
    }

    public String getAccessTokenDuration() { return accessTokenDuration; }
    public void setAccessTokenDuration(String accessTokenDuration) { this.accessTokenDuration = accessTokenDuration; }

    public String getRefreshTokenDuration() { return refreshTokenDuration; }
    public void setRefreshTokenDuration(String refreshTokenDuration) { this.refreshTokenDuration = refreshTokenDuration; }

    public int getMaxLoginAttempts() { return maxLoginAttempts; }
    public void setMaxLoginAttempts(int maxLoginAttempts) { this.maxLoginAttempts = maxLoginAttempts; }

    public int getBcryptStrength() { return bcryptStrength; }
    public void setBcryptStrength(int bcryptStrength) { this.bcryptStrength = bcryptStrength; }

    public boolean isMaintenanceMode() { return maintenanceMode; }
    public void setMaintenanceMode(boolean maintenanceMode) { this.maintenanceMode = maintenanceMode; }
}
