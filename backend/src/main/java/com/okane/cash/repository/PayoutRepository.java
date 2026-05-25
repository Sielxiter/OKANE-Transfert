package com.okane.cash.repository;

import com.okane.cash.entity.Payout;
import java.time.LocalDateTime;
import org.springframework.data.jpa.repository.JpaRepository;

public interface PayoutRepository extends JpaRepository<Payout, Long> {
    boolean existsByTransfer_Id(Long transferId);

    long countByPayoutAgency_IdAndPaidAtBetween(Long agencyId, LocalDateTime start, LocalDateTime end);
}
