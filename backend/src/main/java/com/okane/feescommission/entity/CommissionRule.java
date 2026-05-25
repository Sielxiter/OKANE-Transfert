package com.okane.feescommission.entity;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;
import java.math.BigDecimal;
import java.time.LocalDateTime;

@Entity
@Table(name = "regles_commission")
public class CommissionRule {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "grille_tarifaire_id", nullable = false)
    private FeeGrid feeGrid;

    @Column(name = "pourcentage_agence", nullable = false, precision = 5, scale = 2)
    private BigDecimal agencyPercentage;

    @Column(name = "pourcentage_centrale", nullable = false, precision = 5, scale = 2)
    private BigDecimal centralPercentage;

    @Column(name = "actif", nullable = false)
    private Boolean active;

    @Column(name = "cree_le")
    private LocalDateTime createdAt;

    public CommissionRule() {
    }

    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public FeeGrid getFeeGrid() {
        return feeGrid;
    }

    public void setFeeGrid(FeeGrid feeGrid) {
        this.feeGrid = feeGrid;
    }

    public BigDecimal getAgencyPercentage() {
        return agencyPercentage;
    }

    public void setAgencyPercentage(BigDecimal agencyPercentage) {
        this.agencyPercentage = agencyPercentage;
    }

    public BigDecimal getCentralPercentage() {
        return centralPercentage;
    }

    public void setCentralPercentage(BigDecimal centralPercentage) {
        this.centralPercentage = centralPercentage;
    }

    public Boolean getActive() {
        return active;
    }

    public void setActive(Boolean active) {
        this.active = active;
    }

    public LocalDateTime getCreatedAt() {
        return createdAt;
    }

    public void setCreatedAt(LocalDateTime createdAt) {
        this.createdAt = createdAt;
    }
}
