package com.okane.settingsmanagement.exception;

public class SettingsNotFoundException extends RuntimeException {
    public SettingsNotFoundException(String message) {
        super(message);
    }
}
