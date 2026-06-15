package com.okane.reportmanagement.dto;

import java.util.List;

public class ReportAnalyticsDTO {

    /** Daily transfer counts for the last 7 days (label = day name, value = count). */
    private List<TrendPointDTO> transferVolume;

    /** Monthly revenue + commission trend for the last 5 months. */
    private List<RevenueTrendPointDTO> revenueCommissions;

    /** Top agencies by transfer volume. */
    private List<AgencyPerformanceDTO> agencyPerformance;

    /** Transfer status distribution. */
    private List<StatusDistributionDTO> statusDistribution;

    public ReportAnalyticsDTO() {
    }

    public List<TrendPointDTO> getTransferVolume() { return transferVolume; }
    public void setTransferVolume(List<TrendPointDTO> transferVolume) { this.transferVolume = transferVolume; }

    public List<RevenueTrendPointDTO> getRevenueCommissions() { return revenueCommissions; }
    public void setRevenueCommissions(List<RevenueTrendPointDTO> revenueCommissions) { this.revenueCommissions = revenueCommissions; }

    public List<AgencyPerformanceDTO> getAgencyPerformance() { return agencyPerformance; }
    public void setAgencyPerformance(List<AgencyPerformanceDTO> agencyPerformance) { this.agencyPerformance = agencyPerformance; }

    public List<StatusDistributionDTO> getStatusDistribution() { return statusDistribution; }
    public void setStatusDistribution(List<StatusDistributionDTO> statusDistribution) { this.statusDistribution = statusDistribution; }
}
