package com.okane.reportmanagement.dto;

public class RevenueTrendPointDTO {

    private String label;
    private double revenue;
    private double commission;

    public RevenueTrendPointDTO() {
    }

    public RevenueTrendPointDTO(String label, double revenue, double commission) {
        this.label = label;
        this.revenue = revenue;
        this.commission = commission;
    }

    public String getLabel() { return label; }
    public void setLabel(String label) { this.label = label; }

    public double getRevenue() { return revenue; }
    public void setRevenue(double revenue) { this.revenue = revenue; }

    public double getCommission() { return commission; }
    public void setCommission(double commission) { this.commission = commission; }
}
