package com.okane.currencyfx.entity;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;
import jakarta.persistence.UniqueConstraint;
import java.math.BigDecimal;
import java.time.LocalDateTime;

@Entity
@Table(name = "corridors_transfert", uniqueConstraints = {
    @UniqueConstraint(columnNames = { "pays_source_id", "pays_destination_id" })
})
public class TransferCorridor {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "pays_source_id", nullable = false)
    private Country sourceCountry;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "pays_destination_id", nullable = false)
    private Country destinationCountry;

    @Column(name = "actif", nullable = false)
    private Boolean active;

    @Column(name = "plafond_journalier", precision = 15, scale = 2)
    private BigDecimal dailyLimit;

    @Column(name = "cree_le")
    private LocalDateTime createdAt;

    @Column(name = "modifie_le")
    private LocalDateTime updatedAt;

    public TransferCorridor() {
    }

    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public Country getSourceCountry() {
        return sourceCountry;
    }

    public void setSourceCountry(Country sourceCountry) {
        this.sourceCountry = sourceCountry;
    }

    public Country getDestinationCountry() {
        return destinationCountry;
    }

    public void setDestinationCountry(Country destinationCountry) {
        this.destinationCountry = destinationCountry;
    }

    public Boolean getActive() {
        return active;
    }

    public void setActive(Boolean active) {
        this.active = active;
    }

    public BigDecimal getDailyLimit() {
        return dailyLimit;
    }

    public void setDailyLimit(BigDecimal dailyLimit) {
        this.dailyLimit = dailyLimit;
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
