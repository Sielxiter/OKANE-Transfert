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
@Table(name = "tranches_tarifaires")
public class FeeBracket {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "grille_tarifaire_id", nullable = false)
    private FeeGrid feeGrid;

    @Column(name = "montant_min", nullable = false, precision = 15, scale = 2)
    private BigDecimal minAmount;

    @Column(name = "montant_max", nullable = false, precision = 15, scale = 2)
    private BigDecimal maxAmount;

    @Column(name = "type_frais", nullable = false, length = 50)
    private String feeType;

    @Column(name = "valeur_frais", nullable = false, precision = 15, scale = 2)
    private BigDecimal feeValue;

    @Column(name = "cree_le")
    private LocalDateTime createdAt;

    public FeeBracket() {
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

    public BigDecimal getMinAmount() {
        return minAmount;
    }

    public void setMinAmount(BigDecimal minAmount) {
        this.minAmount = minAmount;
    }

    public BigDecimal getMaxAmount() {
        return maxAmount;
    }

    public void setMaxAmount(BigDecimal maxAmount) {
        this.maxAmount = maxAmount;
    }

    public String getFeeType() {
        return feeType;
    }

    public void setFeeType(String feeType) {
        this.feeType = feeType;
    }

    public BigDecimal getFeeValue() {
        return feeValue;
    }

    public void setFeeValue(BigDecimal feeValue) {
        this.feeValue = feeValue;
    }

    public LocalDateTime getCreatedAt() {
        return createdAt;
    }

    public void setCreatedAt(LocalDateTime createdAt) {
        this.createdAt = createdAt;
    }
}
