package com.okane.cash.repository;

import com.okane.cash.entity.Payout;
import java.time.LocalDateTime;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;

public interface PayoutRepository extends JpaRepository<Payout, Long>, JpaSpecificationExecutor<Payout> {
    long countByStatus(String status);

    long countByStatusIsNull();

    long countByPaidAtBetween(LocalDateTime start, LocalDateTime end);
}
