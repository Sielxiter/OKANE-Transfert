package com.okane.settingsmanagement.dto;

public class PreferencesSettingsDTO {

    private String language;
    private String theme;
    private String defaultCurrency;
    private String timezone;

    public PreferencesSettingsDTO() {
    }

    public String getLanguage() { return language; }
    public void setLanguage(String language) { this.language = language; }

    public String getTheme() { return theme; }
    public void setTheme(String theme) { this.theme = theme; }

    public String getDefaultCurrency() { return defaultCurrency; }
    public void setDefaultCurrency(String defaultCurrency) { this.defaultCurrency = defaultCurrency; }

    public String getTimezone() { return timezone; }
    public void setTimezone(String timezone) { this.timezone = timezone; }
}
