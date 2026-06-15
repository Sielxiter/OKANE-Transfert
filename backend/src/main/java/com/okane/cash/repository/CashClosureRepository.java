package com.okane.cash.repository;

import com.okane.cash.entity.CashClosure;
import java.util.List;
import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;

public interface CashClosureRepository extends JpaRepository<CashClosure, Long> {

    List<CashClosure> findByCashSession_Agency_IdInOrderByClosedAtDesc(List<Long> agencyIds);

    List<CashClosure> findByCashSession_Agency_IdInAndStatusOrderByClosedAtDesc(List<Long> agencyIds, String status);

    Optional<CashClosure> findByIdAndCashSession_Agency_IdIn(Long id, List<Long> agencyIds);

    long countByCashSession_Agency_IdInAndStatus(List<Long> agencyIds, String status);
}
