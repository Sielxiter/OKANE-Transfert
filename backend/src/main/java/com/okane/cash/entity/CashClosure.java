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
@Table(name = "clotures_caisse")
public class CashClosure {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @OneToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "session_caisse_id", nullable = false, unique = true)
    private AgentCashSession cashSession;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "cloture_par", nullable = false)
    private User closedBy;

    @Column(name = "solde_attendu", nullable = false, precision = 15, scale = 2)
    private BigDecimal expectedBalance;

    @Column(name = "solde_reel", nullable = false, precision = 15, scale = 2)
    private BigDecimal actualBalance;

    @Column(name = "montant_ecart", nullable = false, precision = 15, scale = 2)
    private BigDecimal differenceAmount;

    @Column(name = "cloturee_le")
    private LocalDateTime closedAt;

    @Column(name = "notes", length = 255)
    private String note;

    public CashClosure() {
    }

    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public AgentCashSession getCashSession() {
        return cashSession;
    }

    public void setCashSession(AgentCashSession cashSession) {
        this.cashSession = cashSession;
    }

    public User getClosedBy() {
        return closedBy;
    }

    public void setClosedBy(User closedBy) {
        this.closedBy = closedBy;
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

    public LocalDateTime getClosedAt() {
        return closedAt;
    }

    public void setClosedAt(LocalDateTime closedAt) {
        this.closedAt = closedAt;
    }

    public String getNote() {
        return note;
    }

    public void setNote(String note) {
        this.note = note;
    }
}
