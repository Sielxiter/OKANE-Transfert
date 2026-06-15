package com.okane.compliance.entity;

import com.okane.customer.entity.Customer;
import com.okane.transfer.entity.Transfer;
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
@Table(name = "controles_aml")
public class AmlCheck {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "transfert_id", nullable = false)
    private Transfer transfer;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "expediteur_id", nullable = false)
    private Customer sender;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "beneficiaire_id", nullable = false)
    private Customer beneficiary;

    @Column(name = "statut", nullable = false, length = 50)
    private String status;

    @Column(name = "expediteur_liste_surveillance", nullable = false)
    private Boolean senderWatchlistMatch;

    @Column(name = "beneficiaire_liste_surveillance", nullable = false)
    private Boolean beneficiaryWatchlistMatch;

    @Column(name = "seuil_montant_depasse", nullable = false)
    private Boolean amountThresholdExceeded;

    @Column(name = "score_risque", nullable = false)
    private Integer riskScore;

    @Column(name = "notes_resultat", length = 255)
    private String resultNotes;

    @Column(name = "verifie_le")
    private LocalDateTime checkedAt;

    public AmlCheck() {
    }

    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public Transfer getTransfer() {
        return transfer;
    }

    public void setTransfer(Transfer transfer) {
        this.transfer = transfer;
    }

    public Customer getSender() {
        return sender;
    }

    public void setSender(Customer sender) {
        this.sender = sender;
    }

    public Customer getBeneficiary() {
        return beneficiary;
    }

    public void setBeneficiary(Customer beneficiary) {
        this.beneficiary = beneficiary;
    }

    public String getStatus() {
        return status;
    }

    public void setStatus(String status) {
        this.status = status;
    }

    public Boolean getSenderWatchlistMatch() {
        return senderWatchlistMatch;
    }

    public void setSenderWatchlistMatch(Boolean senderWatchlistMatch) {
        this.senderWatchlistMatch = senderWatchlistMatch;
    }

    public Boolean getBeneficiaryWatchlistMatch() {
        return beneficiaryWatchlistMatch;
    }

    public void setBeneficiaryWatchlistMatch(Boolean beneficiaryWatchlistMatch) {
        this.beneficiaryWatchlistMatch = beneficiaryWatchlistMatch;
    }

    public Boolean getAmountThresholdExceeded() {
        return amountThresholdExceeded;
    }

    public void setAmountThresholdExceeded(Boolean amountThresholdExceeded) {
        this.amountThresholdExceeded = amountThresholdExceeded;
    }

    public Integer getRiskScore() {
        return riskScore;
    }

    public void setRiskScore(Integer riskScore) {
        this.riskScore = riskScore;
    }

    public String getResultNotes() {
        return resultNotes;
    }

    public void setResultNotes(String resultNotes) {
        this.resultNotes = resultNotes;
    }

    public LocalDateTime getCheckedAt() {
        return checkedAt;
    }

    public void setCheckedAt(LocalDateTime checkedAt) {
        this.checkedAt = checkedAt;
    }
}
