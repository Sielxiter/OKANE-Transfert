package com.okane.reportmanagement.dto;

import java.math.BigDecimal;

public class AgencyPerformanceDTO {

    private String agencyCode;
    private String agencyName;
    private BigDecimal volume;
    private long transferCount;
    private String currency;
    private double share;

    public AgencyPerformanceDTO() {
    }

    public String getAgencyCode() { return agencyCode; }
    public void setAgencyCode(String agencyCode) { this.agencyCode = agencyCode; }

    public String getAgencyName() { return agencyName; }
    public void setAgencyName(String agencyName) { this.agencyName = agencyName; }

    public BigDecimal getVolume() { return volume; }
    public void setVolume(BigDecimal volume) { this.volume = volume; }

    public long getTransferCount() { return transferCount; }
    public void setTransferCount(long transferCount) { this.transferCount = transferCount; }

    public String getCurrency() { return currency; }
    public void setCurrency(String currency) { this.currency = currency; }

    public double getShare() { return share; }
    public void setShare(double share) { this.share = share; }
}
