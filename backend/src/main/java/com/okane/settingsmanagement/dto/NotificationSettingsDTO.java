package com.okane.settingsmanagement.dto;

public class NotificationSettingsDTO {

    private boolean emailNotifications;
    private boolean systemNotifications;
    private boolean complianceAlerts;
    private boolean paymentAlerts;
    private boolean suspiciousTransferAlerts;

    public NotificationSettingsDTO() {
    }

    public boolean isEmailNotifications() { return emailNotifications; }
    public void setEmailNotifications(boolean emailNotifications) { this.emailNotifications = emailNotifications; }

    public boolean isSystemNotifications() { return systemNotifications; }
    public void setSystemNotifications(boolean systemNotifications) { this.systemNotifications = systemNotifications; }

    public boolean isComplianceAlerts() { return complianceAlerts; }
    public void setComplianceAlerts(boolean complianceAlerts) { this.complianceAlerts = complianceAlerts; }

    public boolean isPaymentAlerts() { return paymentAlerts; }
    public void setPaymentAlerts(boolean paymentAlerts) { this.paymentAlerts = paymentAlerts; }

    public boolean isSuspiciousTransferAlerts() { return suspiciousTransferAlerts; }
    public void setSuspiciousTransferAlerts(boolean suspiciousTransferAlerts) { this.suspiciousTransferAlerts = suspiciousTransferAlerts; }
}
