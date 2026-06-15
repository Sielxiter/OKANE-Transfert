package com.okane.reportmanagement.dto;

import java.math.BigDecimal;

public class ReportSummaryDTO {

    private long dailyVolume;
    private BigDecimal monthlyVolume;
    private BigDecimal revenue;
    private BigDecimal totalCommissions;
    private long successfulTransfers;
    private double failureRate;

    public ReportSummaryDTO() {
    }

    public ReportSummaryDTO(long dailyVolume, BigDecimal monthlyVolume, BigDecimal revenue,
                             BigDecimal totalCommissions, long successfulTransfers, double failureRate) {
        this.dailyVolume = dailyVolume;
        this.monthlyVolume = monthlyVolume;
        this.revenue = revenue;
        this.totalCommissions = totalCommissions;
        this.successfulTransfers = successfulTransfers;
        this.failureRate = failureRate;
    }

    public long getDailyVolume() { return dailyVolume; }
    public void setDailyVolume(long dailyVolume) { this.dailyVolume = dailyVolume; }

    public BigDecimal getMonthlyVolume() { return monthlyVolume; }
    public void setMonthlyVolume(BigDecimal monthlyVolume) { this.monthlyVolume = monthlyVolume; }

    public BigDecimal getRevenue() { return revenue; }
    public void setRevenue(BigDecimal revenue) { this.revenue = revenue; }

    public BigDecimal getTotalCommissions() { return totalCommissions; }
    public void setTotalCommissions(BigDecimal totalCommissions) { this.totalCommissions = totalCommissions; }

    public long getSuccessfulTransfers() { return successfulTransfers; }
    public void setSuccessfulTransfers(long successfulTransfers) { this.successfulTransfers = successfulTransfers; }

    public double getFailureRate() { return failureRate; }
    public void setFailureRate(double failureRate) { this.failureRate = failureRate; }
}
