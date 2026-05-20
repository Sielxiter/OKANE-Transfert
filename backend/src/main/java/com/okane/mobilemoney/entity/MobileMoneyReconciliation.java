package com.okane.mobilemoney.entity;

import com.okane.auth.entity.User;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.OneToOne;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;
import java.math.BigDecimal;
import java.time.LocalDateTime;

@Entity
@Table(name = "mobile_money_reconciliations")
public class MobileMoneyReconciliation {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @OneToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "mobile_money_transfer_id", nullable = false, unique = true)
    private MobileMoneyTransfer mobileMoneyTransfer;

    @Column(name = "operator_reference", nullable = false, length = 100)
    private String operatorReference;

    @Column(name = "expected_amount", nullable = false, precision = 15, scale = 2)
    private BigDecimal expectedAmount;

    @Column(name = "operator_amount", nullable = false, precision = 15, scale = 2)
    private BigDecimal operatorAmount;

    @Column(name = "status", nullable = false, length = 50)
    private String status;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "reconciled_by")
    private User reconciledBy;

    @Column(name = "reconciled_at")
    private LocalDateTime reconciledAt;

    @Column(name = "note", length = 255)
    private String note;

    public MobileMoneyReconciliation() {
    }

    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public MobileMoneyTransfer getMobileMoneyTransfer() {
        return mobileMoneyTransfer;
    }

    public void setMobileMoneyTransfer(MobileMoneyTransfer mobileMoneyTransfer) {
        this.mobileMoneyTransfer = mobileMoneyTransfer;
    }

    public String getOperatorReference() {
        return operatorReference;
    }

    public void setOperatorReference(String operatorReference) {
        this.operatorReference = operatorReference;
    }

    public BigDecimal getExpectedAmount() {
        return expectedAmount;
    }

    public void setExpectedAmount(BigDecimal expectedAmount) {
        this.expectedAmount = expectedAmount;
    }

    public BigDecimal getOperatorAmount() {
        return operatorAmount;
    }

    public void setOperatorAmount(BigDecimal operatorAmount) {
        this.operatorAmount = operatorAmount;
    }

    public String getStatus() {
        return status;
    }

    public void setStatus(String status) {
        this.status = status;
    }

    public User getReconciledBy() {
        return reconciledBy;
    }

    public void setReconciledBy(User reconciledBy) {
        this.reconciledBy = reconciledBy;
    }

    public LocalDateTime getReconciledAt() {
        return reconciledAt;
    }

    public void setReconciledAt(LocalDateTime reconciledAt) {
        this.reconciledAt = reconciledAt;
    }

    public String getNote() {
        return note;
    }

    public void setNote(String note) {
        this.note = note;
    }
}
