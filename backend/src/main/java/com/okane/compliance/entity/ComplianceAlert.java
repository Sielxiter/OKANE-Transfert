package com.okane.compliance.entity;

import com.okane.customer.entity.Customer;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;
import java.time.LocalDateTime;

@Entity
@Table(name = "alertes_conformite")
public class ComplianceAlert {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "client_id", nullable = false)
    private Customer customer;

    @Column(name = "transfert_id")
    private Long transferId;

    /** KYC or AML */
    @Column(name = "type_alerte", nullable = false, length = 20)
    private String alertType;

    /** LOW, MEDIUM, HIGH */
    @Column(name = "niveau_risque", nullable = false, length = 20)
    private String riskLevel;

    @Column(name = "message", length = 500)
    private String message;

    @Column(name = "source", length = 100)
    private String source;

    @Column(name = "score_correspondance")
    private Double matchScore;

    @Column(name = "nom_entite_correspondante", length = 200)
    private String matchedEntityName;

    /** EN_ATTENTE, VALIDE, REJETE, TRAITE */
    @Column(name = "statut", nullable = false, length = 30)
    private String status;

    @Column(name = "cree_le")
    private LocalDateTime createdAt;

    public ComplianceAlert() {
    }

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public Customer getCustomer() { return customer; }
    public void setCustomer(Customer customer) { this.customer = customer; }

    public Long getTransferId() { return transferId; }
    public void setTransferId(Long transferId) { this.transferId = transferId; }

    public String getAlertType() { return alertType; }
    public void setAlertType(String alertType) { this.alertType = alertType; }

    public String getRiskLevel() { return riskLevel; }
    public void setRiskLevel(String riskLevel) { this.riskLevel = riskLevel; }

    public String getMessage() { return message; }
    public void setMessage(String message) { this.message = message; }

    public String getSource() { return source; }
    public void setSource(String source) { this.source = source; }

    public Double getMatchScore() { return matchScore; }
    public void setMatchScore(Double matchScore) { this.matchScore = matchScore; }

    public String getMatchedEntityName() { return matchedEntityName; }
    public void setMatchedEntityName(String matchedEntityName) { this.matchedEntityName = matchedEntityName; }

    public String getStatus() { return status; }
    public void setStatus(String status) { this.status = status; }

    public LocalDateTime getCreatedAt() { return createdAt; }
    public void setCreatedAt(LocalDateTime createdAt) { this.createdAt = createdAt; }
}
