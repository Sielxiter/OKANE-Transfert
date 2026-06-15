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

    // â”€â”€ Extended fields for compliance admin UI â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
    /** Document type: CIN, PASSPORT, RESIDENCE, DRIVING */
    @Column(name = "type_document", length = 50)
    private String documentType;

    /** Masked document number, e.g. ABâ€¢â€¢â€¢â€¢12 */
    @Column(name = "numero_document_masque", length = 100)
    private String maskedDocumentNumber;

    /** Risk level: LOW, MEDIUM, HIGH, CRITICAL */
    @Column(name = "niveau_risque", length = 20)
    private String riskLevel;

    /** When the KYC was submitted by the client */
    @Column(name = "soumis_le")
    private LocalDateTime submittedAt;

    /** Reason for rejection */
    @Column(name = "motif_rejet", length = 255)
    private String rejectionReason;

    public KycCheck() {
    }

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public Customer getCustomer() { return customer; }
    public void setCustomer(Customer customer) { this.customer = customer; }

    public User getCheckedBy() { return checkedBy; }
    public void setCheckedBy(User checkedBy) { this.checkedBy = checkedBy; }

    public String getStatus() { return status; }
    public void setStatus(String status) { this.status = status; }

    public Boolean getIdentityPatternValid() { return identityPatternValid; }
    public void setIdentityPatternValid(Boolean identityPatternValid) { this.identityPatternValid = identityPatternValid; }

    public String getNotes() { return notes; }
    public void setNotes(String notes) { this.notes = notes; }

    public LocalDateTime getCheckedAt() { return checkedAt; }
    public void setCheckedAt(LocalDateTime checkedAt) { this.checkedAt = checkedAt; }

    public String getDocumentType() { return documentType; }
    public void setDocumentType(String documentType) { this.documentType = documentType; }

    public String getMaskedDocumentNumber() { return maskedDocumentNumber; }
    public void setMaskedDocumentNumber(String maskedDocumentNumber) { this.maskedDocumentNumber = maskedDocumentNumber; }

    public String getRiskLevel() { return riskLevel; }
    public void setRiskLevel(String riskLevel) { this.riskLevel = riskLevel; }

    public LocalDateTime getSubmittedAt() { return submittedAt; }
    public void setSubmittedAt(LocalDateTime submittedAt) { this.submittedAt = submittedAt; }

    public String getRejectionReason() { return rejectionReason; }
    public void setRejectionReason(String rejectionReason) { this.rejectionReason = rejectionReason; }
}
