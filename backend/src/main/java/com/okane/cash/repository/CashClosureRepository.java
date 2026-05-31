package com.okane.cash.repository;

import com.okane.cash.entity.CashClosure;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.repository.query.Param;

public interface CashClosureRepository extends JpaRepository<CashClosure, Long> {
    Optional<CashClosure> findByCashSession_Id(Long sessionId);
    List<CashClosure> findByCashSession_Agency_IdOrderByClosedAtDesc(Long agencyId);
    List<CashClosure> findByCashSession_Agency_IdAndCashSession_SessionDate(Long agencyId, LocalDate sessionDate);
    List<CashClosure> findByCashSession_Agency_IdAndClosedAtGreaterThanEqualAndClosedAtLessThanEqual(
            Long agencyId, LocalDateTime start, LocalDateTime end);
}
