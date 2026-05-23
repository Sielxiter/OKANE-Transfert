package com.okane.settingsmanagement.entity;

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
@Table(name = "preferences_utilisateur")
public class UserPreference {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @OneToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "utilisateur_id", nullable = false, unique = true)
    private User user;

    @Column(name = "langue", length = 10)
    private String language;

    @Column(name = "theme", length = 20)
    private String theme;

    @Column(name = "devise_defaut", length = 10)
    private String defaultCurrency;

    @Column(name = "fuseau_horaire", length = 60)
    private String timezone;

    @Column(name = "notif_email")
    private Boolean emailNotifications;

    @Column(name = "notif_systeme")
    private Boolean systemNotifications;

    @Column(name = "notif_conformite")
    private Boolean complianceAlerts;

    @Column(name = "notif_paiements")
    private Boolean paymentAlerts;

    @Column(name = "notif_transferts_suspects")
    private Boolean suspiciousTransferAlerts;

    @Column(name = "cree_le")
    private LocalDateTime createdAt;

    @Column(name = "modifie_le")
    private LocalDateTime updatedAt;

    public UserPreference() {
    }

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public User getUser() { return user; }
    public void setUser(User user) { this.user = user; }

    public String getLanguage() { return language; }
    public void setLanguage(String language) { this.language = language; }

    public String getTheme() { return theme; }
    public void setTheme(String theme) { this.theme = theme; }

    public String getDefaultCurrency() { return defaultCurrency; }
    public void setDefaultCurrency(String defaultCurrency) { this.defaultCurrency = defaultCurrency; }

    public String getTimezone() { return timezone; }
    public void setTimezone(String timezone) { this.timezone = timezone; }

    public Boolean getEmailNotifications() { return emailNotifications; }
    public void setEmailNotifications(Boolean emailNotifications) { this.emailNotifications = emailNotifications; }

    public Boolean getSystemNotifications() { return systemNotifications; }
    public void setSystemNotifications(Boolean systemNotifications) { this.systemNotifications = systemNotifications; }

    public Boolean getComplianceAlerts() { return complianceAlerts; }
    public void setComplianceAlerts(Boolean complianceAlerts) { this.complianceAlerts = complianceAlerts; }

    public Boolean getPaymentAlerts() { return paymentAlerts; }
    public void setPaymentAlerts(Boolean paymentAlerts) { this.paymentAlerts = paymentAlerts; }

    public Boolean getSuspiciousTransferAlerts() { return suspiciousTransferAlerts; }
    public void setSuspiciousTransferAlerts(Boolean suspiciousTransferAlerts) { this.suspiciousTransferAlerts = suspiciousTransferAlerts; }

    public LocalDateTime getCreatedAt() { return createdAt; }
    public void setCreatedAt(LocalDateTime createdAt) { this.createdAt = createdAt; }

    public LocalDateTime getUpdatedAt() { return updatedAt; }
    public void setUpdatedAt(LocalDateTime updatedAt) { this.updatedAt = updatedAt; }
}
