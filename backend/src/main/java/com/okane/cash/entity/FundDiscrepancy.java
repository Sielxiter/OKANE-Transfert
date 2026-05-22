package com.okane.cash.entity;

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
@Table(name = "ecarts_caisse")
public class FundDiscrepancy {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @OneToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "cloture_caisse_id", nullable = false, unique = true)
    private CashClosure cashClosure;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "session_caisse_id", nullable = false)
    private AgentCashSession cashSession;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "signale_par", nullable = false)
    private User reportedBy;

    @Column(name = "solde_attendu", nullable = false, precision = 15, scale = 2)
    private BigDecimal expectedBalance;

    @Column(name = "solde_reel", nullable = false, precision = 15, scale = 2)
    private BigDecimal actualBalance;

    @Column(name = "montant_ecart", nullable = false, precision = 15, scale = 2)
    private BigDecimal differenceAmount;

    @Column(name = "type_ecart", nullable = false, length = 50)
    private String discrepancyType;

    @Column(name = "statut", nullable = false, length = 50)
    private String status;

    @Column(name = "description", length = 255)
    private String description;

    @Column(name = "signale_le")
    private LocalDateTime reportedAt;

    public FundDiscrepancy() {
    }

    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public CashClosure getCashClosure() {
        return cashClosure;
    }

    public void setCashClosure(CashClosure cashClosure) {
        this.cashClosure = cashClosure;
    }

    public AgentCashSession getCashSession() {
        return cashSession;
    }

    public void setCashSession(AgentCashSession cashSession) {
        this.cashSession = cashSession;
    }

    public User getReportedBy() {
        return reportedBy;
    }

    public void setReportedBy(User reportedBy) {
        this.reportedBy = reportedBy;
    }

    public BigDecimal getExpectedBalance() {
        return expectedBalance;
    }

    public void setExpectedBalance(BigDecimal expectedBalance) {
        this.expectedBalance = expectedBalance;
    }

    public BigDecimal getActualBalance() {
        return actualBalance;
    }

    public void setActualBalance(BigDecimal actualBalance) {
        this.actualBalance = actualBalance;
    }

    public BigDecimal getDifferenceAmount() {
        return differenceAmount;
    }

    public void setDifferenceAmount(BigDecimal differenceAmount) {
        this.differenceAmount = differenceAmount;
    }

    public String getDiscrepancyType() {
        return discrepancyType;
    }

    public void setDiscrepancyType(String discrepancyType) {
        this.discrepancyType = discrepancyType;
    }

    public String getStatus() {
        return status;
    }

    public void setStatus(String status) {
        this.status = status;
    }

    public String getDescription() {
        return description;
    }

    public void setDescription(String description) {
        this.description = description;
    }

    public LocalDateTime getReportedAt() {
        return reportedAt;
    }

    public void setReportedAt(LocalDateTime reportedAt) {
        this.reportedAt = reportedAt;
    }
}
