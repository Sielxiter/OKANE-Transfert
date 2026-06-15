package com.okane.auditmanagement.dto;

public class AuditSummaryDTO {

    private long actionsToday;
    private long failedLogins;
    private long sensitiveChanges;
    private long securityAlerts;
    private long adminActions;
    private long criticalLogs;

    public AuditSummaryDTO() {
    }

    public AuditSummaryDTO(long actionsToday, long failedLogins, long sensitiveChanges,
                            long securityAlerts, long adminActions, long criticalLogs) {
        this.actionsToday = actionsToday;
        this.failedLogins = failedLogins;
        this.sensitiveChanges = sensitiveChanges;
        this.securityAlerts = securityAlerts;
        this.adminActions = adminActions;
        this.criticalLogs = criticalLogs;
    }

    public long getActionsToday() { return actionsToday; }
    public void setActionsToday(long actionsToday) { this.actionsToday = actionsToday; }

    public long getFailedLogins() { return failedLogins; }
    public void setFailedLogins(long failedLogins) { this.failedLogins = failedLogins; }

    public long getSensitiveChanges() { return sensitiveChanges; }
    public void setSensitiveChanges(long sensitiveChanges) { this.sensitiveChanges = sensitiveChanges; }

    public long getSecurityAlerts() { return securityAlerts; }
    public void setSecurityAlerts(long securityAlerts) { this.securityAlerts = securityAlerts; }

    public long getAdminActions() { return adminActions; }
    public void setAdminActions(long adminActions) { this.adminActions = adminActions; }

    public long getCriticalLogs() { return criticalLogs; }
    public void setCriticalLogs(long criticalLogs) { this.criticalLogs = criticalLogs; }
}
