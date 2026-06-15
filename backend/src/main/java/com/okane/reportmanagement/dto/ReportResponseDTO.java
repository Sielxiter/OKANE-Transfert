package com.okane.reportmanagement.dto;

import com.okane.reportmanagement.domain.ReportPeriod;
import com.okane.reportmanagement.domain.ReportStatus;
import com.okane.reportmanagement.domain.ReportType;

public class ReportResponseDTO {

    private Long id;
    private String name;
    private ReportType type;
    private ReportPeriod period;
    private String periodRange;
    private String agencyName;
    private String agencyCode;
    private String country;
    private String currency;
    private ReportStatus status;
    private String generatedAt;
    private String generatedBy;

    public ReportResponseDTO() {
    }

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public String getName() { return name; }
    public void setName(String name) { this.name = name; }

    public ReportType getType() { return type; }
    public void setType(ReportType type) { this.type = type; }

    public ReportPeriod getPeriod() { return period; }
    public void setPeriod(ReportPeriod period) { this.period = period; }

    public String getPeriodRange() { return periodRange; }
    public void setPeriodRange(String periodRange) { this.periodRange = periodRange; }

    public String getAgencyName() { return agencyName; }
    public void setAgencyName(String agencyName) { this.agencyName = agencyName; }

    public String getAgencyCode() { return agencyCode; }
    public void setAgencyCode(String agencyCode) { this.agencyCode = agencyCode; }

    public String getCountry() { return country; }
    public void setCountry(String country) { this.country = country; }

    public String getCurrency() { return currency; }
    public void setCurrency(String currency) { this.currency = currency; }

    public ReportStatus getStatus() { return status; }
    public void setStatus(ReportStatus status) { this.status = status; }

    public String getGeneratedAt() { return generatedAt; }
    public void setGeneratedAt(String generatedAt) { this.generatedAt = generatedAt; }

    public String getGeneratedBy() { return generatedBy; }
    public void setGeneratedBy(String generatedBy) { this.generatedBy = generatedBy; }
}
