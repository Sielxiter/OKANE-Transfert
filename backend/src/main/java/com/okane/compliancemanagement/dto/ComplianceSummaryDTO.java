package com.okane.compliancemanagement.dto;

public class ComplianceSummaryDTO {

    private long pendingKyc;
    private long verifiedKyc;
    private long rejectedKyc;
    private long amlAlerts;
    private long suspiciousTransactions;
    private long blacklistedClients;

    public ComplianceSummaryDTO() {
    }

    public ComplianceSummaryDTO(long pendingKyc, long verifiedKyc, long rejectedKyc,
                                 long amlAlerts, long suspiciousTransactions, long blacklistedClients) {
        this.pendingKyc = pendingKyc;
        this.verifiedKyc = verifiedKyc;
        this.rejectedKyc = rejectedKyc;
        this.amlAlerts = amlAlerts;
        this.suspiciousTransactions = suspiciousTransactions;
        this.blacklistedClients = blacklistedClients;
    }

    public long getPendingKyc() { return pendingKyc; }
    public void setPendingKyc(long pendingKyc) { this.pendingKyc = pendingKyc; }

    public long getVerifiedKyc() { return verifiedKyc; }
    public void setVerifiedKyc(long verifiedKyc) { this.verifiedKyc = verifiedKyc; }

    public long getRejectedKyc() { return rejectedKyc; }
    public void setRejectedKyc(long rejectedKyc) { this.rejectedKyc = rejectedKyc; }

    public long getAmlAlerts() { return amlAlerts; }
    public void setAmlAlerts(long amlAlerts) { this.amlAlerts = amlAlerts; }

    public long getSuspiciousTransactions() { return suspiciousTransactions; }
    public void setSuspiciousTransactions(long suspiciousTransactions) { this.suspiciousTransactions = suspiciousTransactions; }

    public long getBlacklistedClients() { return blacklistedClients; }
    public void setBlacklistedClients(long blacklistedClients) { this.blacklistedClients = blacklistedClients; }
}
