package com.okane.cash.repository;

import com.okane.cash.entity.CashMovement;
import java.util.List;
import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.repository.query.Param;

public interface CashMovementRepository extends JpaRepository<CashMovement, Long> {
    List<CashMovement> findByCashSession_IdOrderByCreatedAtDesc(Long sessionId);
}
