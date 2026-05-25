package com.okane.cash.repository;

import com.okane.cash.entity.CashClosure;
import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;

public interface CashClosureRepository extends JpaRepository<CashClosure, Long> {
    Optional<CashClosure> findByCashSession_Id(Long sessionId);
}
