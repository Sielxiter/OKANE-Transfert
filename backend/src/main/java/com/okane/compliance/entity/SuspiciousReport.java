package com.okane.compliance.entity;

import com.okane.auth.entity.User;
import com.okane.customer.entity.Customer;
import com.okane.transfer.entity.Transfer;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.Lob;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;
import java.math.BigDecimal;
import java.time.LocalDateTime;

@Entity
@Table(name = "declarations_soupcon")
public class SuspiciousReport {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "transfert_id", nullable = false)
    private Transfer transfer;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "controle_aml_id", nullable = false)
    private AmlCheck amlCheck;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "client_id", nullable = false)
    private Customer customer;

    @Column(name = "type_declaration", nullable = false, length = 50)
    private String reportType;

    @Column(name = "statut", nullable = false, length = 50)
    private String status;

    @Lob
    @Column(name = "description", nullable = false)
    private String description;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "examine_par")
    private User reviewedBy;

    @Column(name = "examine_le")
    private LocalDateTime reviewedAt;

    @Column(name = "cree_le")
    private LocalDateTime createdAt;

    // â”€â”€ Extended fields for AML alert admin UI â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
    /** Human-readable reference, e.g. AML-7001 */
    @Column(name = "reference_alerte", length = 50)
    private String alertReference;

    /** Alert type: HIGH_AMOUNT, REPEATED_TRANSFERS, SENSITIVE_CORRIDOR, BLACKLIST_MATCH, SUSPICIOUS_PATTERN */
    @Column(name = "type_alerte", length = 50)
    private String alertType;

    /** Amount involved */
    @Column(name = "montant_alerte", precision = 15, scale = 2)
    private BigDecimal alertAmount;

    /** Currency code */
    @Column(name = "devise_alerte", length = 10)
    private String alertCurrency;

    /** Risk level: LOW, MEDIUM, HIGH, CRITICAL */
    @Column(name = "niveau_risque", length = 20)
    private String riskLevel;

    /** AML alert status: NEW, IN_ANALYSIS, RESOLVED, ESCALATED */
    @Column(name = "statut_alerte", length = 30)
    private String alertStatus;

    /** When the alert was resolved */
    @Column(name = "resolu_le")
    private LocalDateTime resolvedAt;

    public SuspiciousReport() {
    }

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public Transfer getTransfer() { return transfer; }
    public void setTransfer(Transfer transfer) { this.transfer = transfer; }

    public AmlCheck getAmlCheck() { return amlCheck; }
    public void setAmlCheck(AmlCheck amlCheck) { this.amlCheck = amlCheck; }

    public Customer getCustomer() { return customer; }
    public void setCustomer(Customer customer) { this.customer = customer; }

    public String getReportType() { return reportType; }
    public void setReportType(String reportType) { this.reportType = reportType; }

    public String getStatus() { return status; }
    public void setStatus(String status) { this.status = status; }

    public String getDescription() { return description; }
    public void setDescription(String description) { this.description = description; }

    public User getReviewedBy() { return reviewedBy; }
    public void setReviewedBy(User reviewedBy) { this.reviewedBy = reviewedBy; }

    public LocalDateTime getReviewedAt() { return reviewedAt; }
    public void setReviewedAt(LocalDateTime reviewedAt) { this.reviewedAt = reviewedAt; }

    public LocalDateTime getCreatedAt() { return createdAt; }
    public void setCreatedAt(LocalDateTime createdAt) { this.createdAt = createdAt; }

    public String getAlertReference() { return alertReference; }
    public void setAlertReference(String alertReference) { this.alertReference = alertReference; }

    public String getAlertType() { return alertType; }
    public void setAlertType(String alertType) { this.alertType = alertType; }

    public BigDecimal getAlertAmount() { return alertAmount; }
    public void setAlertAmount(BigDecimal alertAmount) { this.alertAmount = alertAmount; }

    public String getAlertCurrency() { return alertCurrency; }
    public void setAlertCurrency(String alertCurrency) { this.alertCurrency = alertCurrency; }

    public String getRiskLevel() { return riskLevel; }
    public void setRiskLevel(String riskLevel) { this.riskLevel = riskLevel; }

    public String getAlertStatus() { return alertStatus; }
    public void setAlertStatus(String alertStatus) { this.alertStatus = alertStatus; }

    public LocalDateTime getResolvedAt() { return resolvedAt; }
    public void setResolvedAt(LocalDateTime resolvedAt) { this.resolvedAt = resolvedAt; }
}
