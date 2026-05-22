package com.okane.compliance.entity;

import com.okane.auth.entity.User;
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
@Table(name = "verifications_kyc")
public class KycCheck {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "client_id", nullable = false)
    private Customer customer;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "verifie_par")
    private User checkedBy;

    @Column(name = "statut", nullable = false, length = 50)
    private String status;

    @Column(name = "format_piece_valide", nullable = false)
    private Boolean identityPatternValid;

    @Column(name = "notes", length = 255)
    private String notes;

    @Column(name = "verifie_le")
    private LocalDateTime checkedAt;

    public KycCheck() {
    }

    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public Customer getCustomer() {
        return customer;
    }

    public void setCustomer(Customer customer) {
        this.customer = customer;
    }

    public User getCheckedBy() {
        return checkedBy;
    }

    public void setCheckedBy(User checkedBy) {
        this.checkedBy = checkedBy;
    }

    public String getStatus() {
        return status;
    }

    public void setStatus(String status) {
        this.status = status;
    }

    public Boolean getIdentityPatternValid() {
        return identityPatternValid;
    }

    public void setIdentityPatternValid(Boolean identityPatternValid) {
        this.identityPatternValid = identityPatternValid;
    }

    public String getNotes() {
        return notes;
    }

    public void setNotes(String notes) {
        this.notes = notes;
    }

    public LocalDateTime getCheckedAt() {
        return checkedAt;
    }

    public void setCheckedAt(LocalDateTime checkedAt) {
        this.checkedAt = checkedAt;
    }
}
