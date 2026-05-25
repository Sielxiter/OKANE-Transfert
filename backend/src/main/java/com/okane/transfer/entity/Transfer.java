package com.okane.transfer.entity;

import com.okane.agency.entity.Agency;
import com.okane.auth.entity.User;
import com.okane.cash.entity.AgentCashSession;
import com.okane.currencyfx.entity.Currency;
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
import java.math.BigDecimal;
import java.time.LocalDateTime;

@Entity
@Table(name = "transferts")
public class Transfer {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "code_reference", nullable = false, unique = true, length = 50)
    private String referenceCode;

    @Column(name = "code_retrait", nullable = false, unique = true, length = 50)
    private String withdrawalCode;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "expediteur_id", nullable = false)
    private Customer sender;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "beneficiaire_id", nullable = false)
    private Customer beneficiary;

    @Column(name = "prenom_expediteur", length = 100)
    private String senderFirstName;

    @Column(name = "nom_expediteur", length = 100)
    private String senderLastName;

    @Column(name = "telephone_expediteur_snapshot", length = 30)
    private String senderPhone;

    @Column(name = "prenom_beneficiaire", length = 100)
    private String beneficiaryFirstName;

    @Column(name = "nom_beneficiaire", length = 100)
    private String beneficiaryLastName;

    @Column(name = "telephone_beneficiaire_snapshot", length = 30)
    private String beneficiaryPhone;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "agence_source_id", nullable = false)
    private Agency sourceAgency;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "cree_par", nullable = false)
    private User createdBy;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "session_caisse_id", nullable = false)
    private AgentCashSession cashSession;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "devise_id", nullable = false)
    private Currency currency;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "devise_destination_id")
    private Currency destinationCurrency;

    @Column(name = "type_piece_beneficiaire", length = 50)
    private String beneficiaryDocumentType;

    @Column(name = "numero_piece_beneficiaire", length = 100)
    private String beneficiaryDocumentNumber;

    @Column(name = "montant", nullable = false, precision = 15, scale = 2)
    private BigDecimal amount;

    @Column(name = "montant_frais", nullable = false, precision = 15, scale = 2)
    private BigDecimal feeAmount;

    @Column(name = "taux_change", nullable = false, precision = 15, scale = 6)
    private BigDecimal exchangeRate;

    @Column(name = "montant_net_recu", nullable = false, precision = 15, scale = 2)
    private BigDecimal netAmount;

    @Column(name = "statut", nullable = false, length = 50)
    private String status;

    @Column(name = "envoye_le")
    private LocalDateTime sentAt;

    @Column(name = "expire_le")
    private LocalDateTime expiresAt;

    @Column(name = "cree_le")
    private LocalDateTime createdAt;

    @Column(name = "modifie_le")
    private LocalDateTime updatedAt;

    public Transfer() {
    }

    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public String getReferenceCode() {
        return referenceCode;
    }

    public void setReferenceCode(String referenceCode) {
        this.referenceCode = referenceCode;
    }

    public String getWithdrawalCode() {
        return withdrawalCode;
    }

    public void setWithdrawalCode(String withdrawalCode) {
        this.withdrawalCode = withdrawalCode;
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

    public String getSenderFirstName() {
        return senderFirstName;
    }

    public void setSenderFirstName(String senderFirstName) {
        this.senderFirstName = senderFirstName;
    }

    public String getSenderLastName() {
        return senderLastName;
    }

    public void setSenderLastName(String senderLastName) {
        this.senderLastName = senderLastName;
    }

    public String getSenderPhone() {
        return senderPhone;
    }

    public void setSenderPhone(String senderPhone) {
        this.senderPhone = senderPhone;
    }

    public String getBeneficiaryFirstName() {
        return beneficiaryFirstName;
    }

    public void setBeneficiaryFirstName(String beneficiaryFirstName) {
        this.beneficiaryFirstName = beneficiaryFirstName;
    }

    public String getBeneficiaryLastName() {
        return beneficiaryLastName;
    }

    public void setBeneficiaryLastName(String beneficiaryLastName) {
        this.beneficiaryLastName = beneficiaryLastName;
    }

    public String getBeneficiaryPhone() {
        return beneficiaryPhone;
    }

    public void setBeneficiaryPhone(String beneficiaryPhone) {
        this.beneficiaryPhone = beneficiaryPhone;
    }

    public Agency getSourceAgency() {
        return sourceAgency;
    }

    public void setSourceAgency(Agency sourceAgency) {
        this.sourceAgency = sourceAgency;
    }

    public User getCreatedBy() {
        return createdBy;
    }

    public void setCreatedBy(User createdBy) {
        this.createdBy = createdBy;
    }

    public AgentCashSession getCashSession() {
        return cashSession;
    }

    public void setCashSession(AgentCashSession cashSession) {
        this.cashSession = cashSession;
    }

    public Currency getCurrency() {
        return currency;
    }

    public void setCurrency(Currency currency) {
        this.currency = currency;
    }

    public Currency getDestinationCurrency() {
        return destinationCurrency;
    }

    public void setDestinationCurrency(Currency destinationCurrency) {
        this.destinationCurrency = destinationCurrency;
    }

    public String getBeneficiaryDocumentType() {
        return beneficiaryDocumentType;
    }

    public void setBeneficiaryDocumentType(String beneficiaryDocumentType) {
        this.beneficiaryDocumentType = beneficiaryDocumentType;
    }

    public String getBeneficiaryDocumentNumber() {
        return beneficiaryDocumentNumber;
    }

    public void setBeneficiaryDocumentNumber(String beneficiaryDocumentNumber) {
        this.beneficiaryDocumentNumber = beneficiaryDocumentNumber;
    }

    public BigDecimal getAmount() {
        return amount;
    }

    public void setAmount(BigDecimal amount) {
        this.amount = amount;
    }

    public BigDecimal getFeeAmount() {
        return feeAmount;
    }

    public void setFeeAmount(BigDecimal feeAmount) {
        this.feeAmount = feeAmount;
    }

    public BigDecimal getExchangeRate() {
        return exchangeRate;
    }

    public void setExchangeRate(BigDecimal exchangeRate) {
        this.exchangeRate = exchangeRate;
    }

    public BigDecimal getNetAmount() {
        return netAmount;
    }

    public void setNetAmount(BigDecimal netAmount) {
        this.netAmount = netAmount;
    }

    public String getStatus() {
        return status;
    }

    public void setStatus(String status) {
        this.status = status;
    }

    public LocalDateTime getSentAt() {
        return sentAt;
    }

    public void setSentAt(LocalDateTime sentAt) {
        this.sentAt = sentAt;
    }

    public LocalDateTime getExpiresAt() {
        return expiresAt;
    }

    public void setExpiresAt(LocalDateTime expiresAt) {
        this.expiresAt = expiresAt;
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
