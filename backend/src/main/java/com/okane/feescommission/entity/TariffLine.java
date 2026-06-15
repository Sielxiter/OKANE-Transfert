package com.okane.feescommission.entity;

import com.okane.feemanagement.domain.TariffValueType;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Enumerated;
import jakarta.persistence.EnumType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import java.math.BigDecimal;
import java.time.LocalDateTime;

@Entity
@Table(name = "grilles_tarifaires_globales")
public class TariffLine {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "montant_min", nullable = false, precision = 15, scale = 2)
    private BigDecimal minAmount;

    @Column(name = "montant_max", nullable = false, precision = 15, scale = 2)
    private BigDecimal maxAmount;

    @Enumerated(EnumType.STRING)
    @Column(name = "type_frais_transfert", nullable = false, length = 20)
    private TariffValueType transferFeeType;

    @Column(name = "valeur_frais_transfert", nullable = false, precision = 15, scale = 2)
    private BigDecimal transferFeeValue;

    @Enumerated(EnumType.STRING)
    @Column(name = "type_commission_agence", nullable = false, length = 20)
    private TariffValueType agencyCommissionType;

    @Column(name = "valeur_commission_agence", nullable = false, precision = 15, scale = 2)
    private BigDecimal agencyCommissionValue;

    @Enumerated(EnumType.STRING)
    @Column(name = "type_commission_centrale", nullable = false, length = 20)
    private TariffValueType centralCommissionType;

    @Column(name = "valeur_commission_centrale", nullable = false, precision = 15, scale = 2)
    private BigDecimal centralCommissionValue;

    @Column(name = "cree_le")
    private LocalDateTime createdAt;

    @Column(name = "modifie_le")
    private LocalDateTime updatedAt;

    public TariffLine() {
    }

    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
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

    public TariffValueType getTransferFeeType() {
        return transferFeeType;
    }

    public void setTransferFeeType(TariffValueType transferFeeType) {
        this.transferFeeType = transferFeeType;
    }

    public BigDecimal getTransferFeeValue() {
        return transferFeeValue;
    }

    public void setTransferFeeValue(BigDecimal transferFeeValue) {
        this.transferFeeValue = transferFeeValue;
    }

    public TariffValueType getAgencyCommissionType() {
        return agencyCommissionType;
    }

    public void setAgencyCommissionType(TariffValueType agencyCommissionType) {
        this.agencyCommissionType = agencyCommissionType;
    }

    public BigDecimal getAgencyCommissionValue() {
        return agencyCommissionValue;
    }

    public void setAgencyCommissionValue(BigDecimal agencyCommissionValue) {
        this.agencyCommissionValue = agencyCommissionValue;
    }

    public TariffValueType getCentralCommissionType() {
        return centralCommissionType;
    }

    public void setCentralCommissionType(TariffValueType centralCommissionType) {
        this.centralCommissionType = centralCommissionType;
    }

    public BigDecimal getCentralCommissionValue() {
        return centralCommissionValue;
    }

    public void setCentralCommissionValue(BigDecimal centralCommissionValue) {
        this.centralCommissionValue = centralCommissionValue;
    }

    public LocalDateTime getCreatedAt() {
        return createdAt;
    }

    public void setCreatedAt(LocalDateTime createdAt) {
        this.createdAt = createdAt;
    }

    public LocalDateTime getUpdatedAt() {
        return updatedAt;
    }

    public void setUpdatedAt(LocalDateTime updatedAt) {
        this.updatedAt = updatedAt;
    }
}
