package com.okane.compliance.entity;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import java.time.LocalDateTime;

@Entity
@Table(name = "liste_surveillance")
public class WatchlistEntry {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "nom_complet", nullable = false, length = 200)
    private String fullName;

    @Column(name = "numero_piece_identite", length = 100)
    private String identityNumber;

    @Column(name = "pays", length = 100)
    private String country;

    @Column(name = "motif", length = 255)
    private String reason;

    @Column(name = "actif", nullable = false)
    private Boolean active;

    @Column(name = "cree_le")
    private LocalDateTime createdAt;

    @Column(name = "code_pays", length = 10)
    private String countryCode;

    @Column(name = "type_entite", length = 30)
    private String entityType;

    @Column(name = "source", length = 30)
    private String source;

    @Column(name = "statut_liste", length = 30)
    private String watchlistStatus;

    public WatchlistEntry() {}

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }
    public String getFullName() { return fullName; }
    public void setFullName(String fullName) { this.fullName = fullName; }
    public String getIdentityNumber() { return identityNumber; }
    public void setIdentityNumber(String identityNumber) { this.identityNumber = identityNumber; }
    public String getCountry() { return country; }
    public void setCountry(String country) { this.country = country; }
    public String getReason() { return reason; }
    public void setReason(String reason) { this.reason = reason; }
    public Boolean getActive() { return active; }
    public void setActive(Boolean active) { this.active = active; }
    public LocalDateTime getCreatedAt() { return createdAt; }
    public void setCreatedAt(LocalDateTime createdAt) { this.createdAt = createdAt; }
    public String getCountryCode() { return countryCode; }
    public void setCountryCode(String countryCode) { this.countryCode = countryCode; }
    public String getEntityType() { return entityType; }
    public void setEntityType(String entityType) { this.entityType = entityType; }
    public String getSource() { return source; }
    public void setSource(String source) { this.source = source; }
    public String getWatchlistStatus() { return watchlistStatus; }
    public void setWatchlistStatus(String watchlistStatus) { this.watchlistStatus = watchlistStatus; }
}