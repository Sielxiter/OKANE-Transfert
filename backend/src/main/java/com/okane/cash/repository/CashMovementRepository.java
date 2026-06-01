package com.okane.cash.repository;

import com.okane.cash.entity.CashMovement;

import java.math.BigDecimal;
import java.util.List;
import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

public interface CashMovementRepository extends JpaRepository<CashMovement, Long> {
    List<CashMovement> findByCashSession_IdOrderByCreatedAtDesc(Long sessionId);

    @Query("SELECT COALESCE(SUM(m.amount), 0) FROM CashMovement m WHERE m.cashSession.id = :sessionId AND m.movementType = :movementType")
    BigDecimal sumAmountBySessionAndType(@Param("sessionId") Long sessionId, @Param("movementType") String movementType);
}
