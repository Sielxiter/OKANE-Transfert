package com.okane.cash.repository;

import com.okane.cash.entity.CashMovement;
import java.util.List;
import org.springframework.data.jpa.repository.JpaRepository;

public interface CashMovementRepository extends JpaRepository<CashMovement, Long> {
    List<CashMovement> findByCashSession_IdOrderByCreatedAtDesc(Long sessionId);
}
