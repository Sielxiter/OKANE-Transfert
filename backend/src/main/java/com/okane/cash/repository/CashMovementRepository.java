package com.okane.cash.repository;

import com.okane.cash.entity.CashMovement;
import java.time.LocalDateTime;
import java.util.List;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import java.math.BigDecimal;

public interface CashMovementRepository extends JpaRepository<CashMovement, Long> {

    List<CashMovement> findByAgency_IdOrderByCreatedAtDesc(Long agencyId);

    List<CashMovement> findByAgency_IdAndCreatedAtBetweenOrderByCreatedAtDesc(
            Long agencyId, LocalDateTime start, LocalDateTime end);

    List<CashMovement> findByCashSession_IdOrderByCreatedAtDesc(Long sessionId);

    @Query("SELECT COALESCE(SUM(CASE WHEN cm.movementType IN ('TRANSFER_IN', 'FUNDING', 'COMMISSION_AGENCY', 'COMMISSION_CENTRAL') THEN cm.amount ELSE -cm.amount END), 0) " +
           "FROM CashMovement cm WHERE cm.agency.id = :agencyId")
    BigDecimal computeBalanceByAgencyId(@Param("agencyId") Long agencyId);

    @Query("SELECT COALESCE(SUM(CASE WHEN cm.movementType IN ('TRANSFER_IN', 'FUNDING', 'COMMISSION_AGENCY', 'COMMISSION_CENTRAL') THEN cm.amount ELSE -cm.amount END), 0) " +
           "FROM CashMovement cm WHERE cm.agency.id = :agencyId AND cm.createdAt >= :start AND cm.createdAt < :end")
    BigDecimal computeTodayFlowByAgencyId(@Param("agencyId") Long agencyId, @Param("start") LocalDateTime start, @Param("end") LocalDateTime end);
}
