package com.okane.settingsmanagement.dto;

public class SecuritySettingsUpdateDTO {

    private Boolean twoFactorEnabled;
    private Boolean securityAlertsEnabled;

    public SecuritySettingsUpdateDTO() {
    }

    public Boolean getTwoFactorEnabled() { return twoFactorEnabled; }
    public void setTwoFactorEnabled(Boolean twoFactorEnabled) { this.twoFactorEnabled = twoFactorEnabled; }

    public Boolean getSecurityAlertsEnabled() { return securityAlertsEnabled; }
    public void setSecurityAlertsEnabled(Boolean securityAlertsEnabled) { this.securityAlertsEnabled = securityAlertsEnabled; }
}
