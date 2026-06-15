package com.okane.reportmanagement.dto;

public class StatusDistributionDTO {

    private String status;
    private long count;
    private double share;

    public StatusDistributionDTO() {
    }

    public StatusDistributionDTO(String status, long count, double share) {
        this.status = status;
        this.count = count;
        this.share = share;
    }

    public String getStatus() { return status; }
    public void setStatus(String status) { this.status = status; }

    public long getCount() { return count; }
    public void setCount(long count) { this.count = count; }

    public double getShare() { return share; }
    public void setShare(double share) { this.share = share; }
}
