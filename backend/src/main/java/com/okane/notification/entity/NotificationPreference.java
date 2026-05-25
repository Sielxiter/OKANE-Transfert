package com.okane.notification.entity;

import com.okane.auth.entity.User;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.OneToOne;
import jakarta.persistence.Table;
import java.time.LocalDateTime;

@Entity
@Table(name = "preferences_notification")
public class NotificationPreference {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @OneToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "utilisateur_id", nullable = false, unique = true)
    private User user;

    @Column(name = "email_active", nullable = false)
    private Boolean emailEnabled;

    @Column(name = "sms_active", nullable = false)
    private Boolean smsEnabled;

    @Column(name = "push_active", nullable = false)
    private Boolean pushEnabled;

    @Column(name = "langue_preferee", nullable = false, length = 10)
    private String preferredLanguage;

    @Column(name = "alerte_transfert_paye", nullable = false)
    private Boolean transferPaidAlerts;

    @Column(name = "alerte_session_caisse", nullable = false)
    private Boolean cashSessionAlerts;

    @Column(name = "alerte_systeme", nullable = false)
    private Boolean systemAlerts;

    @Column(name = "alerte_kyc", nullable = false)
    private Boolean kycAlerts;

    @Column(name = "alerte_ecart_caisse", nullable = false)
    private Boolean cashDiscrepancyAlerts;

    @Column(name = "cree_le")
    private LocalDateTime createdAt;

    @Column(name = "modifie_le")
    private LocalDateTime updatedAt;

    public NotificationPreference() {
    }

    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public User getUser() {
        return user;
    }

    public void setUser(User user) {
        this.user = user;
    }

    public Boolean getEmailEnabled() {
        return emailEnabled;
    }

    public void setEmailEnabled(Boolean emailEnabled) {
        this.emailEnabled = emailEnabled;
    }

    public Boolean getSmsEnabled() {
        return smsEnabled;
    }

    public void setSmsEnabled(Boolean smsEnabled) {
        this.smsEnabled = smsEnabled;
    }

    public Boolean getPushEnabled() {
        return pushEnabled;
    }

    public void setPushEnabled(Boolean pushEnabled) {
        this.pushEnabled = pushEnabled;
    }

    public String getPreferredLanguage() {
        return preferredLanguage;
    }

    public void setPreferredLanguage(String preferredLanguage) {
        this.preferredLanguage = preferredLanguage;
    }

    public Boolean getTransferPaidAlerts() {
        return transferPaidAlerts;
    }

    public void setTransferPaidAlerts(Boolean transferPaidAlerts) {
        this.transferPaidAlerts = transferPaidAlerts;
    }

    public Boolean getCashSessionAlerts() {
        return cashSessionAlerts;
    }

    public void setCashSessionAlerts(Boolean cashSessionAlerts) {
        this.cashSessionAlerts = cashSessionAlerts;
    }

    public Boolean getSystemAlerts() {
        return systemAlerts;
    }

    public void setSystemAlerts(Boolean systemAlerts) {
        this.systemAlerts = systemAlerts;
    }

    public Boolean getKycAlerts() {
        return kycAlerts;
    }

    public void setKycAlerts(Boolean kycAlerts) {
        this.kycAlerts = kycAlerts;
    }

    public Boolean getCashDiscrepancyAlerts() {
        return cashDiscrepancyAlerts;
    }

    public void setCashDiscrepancyAlerts(Boolean cashDiscrepancyAlerts) {
        this.cashDiscrepancyAlerts = cashDiscrepancyAlerts;
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
