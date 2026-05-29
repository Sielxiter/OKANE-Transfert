package com.okane.cash.repository;

import com.okane.cash.entity.Payout;
import java.time.LocalDateTime;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;
import java.util.Optional;

public interface PayoutRepository extends JpaRepository<Payout, Long> {
    boolean existsByTransfer_Id(Long transferId);

    long countByPayoutAgency_IdAndPaidAtBetween(Long agencyId, LocalDateTime start, LocalDateTime end);

    List<Payout> findByPayoutAgency_IdOrderByPaidAtDesc(Long agencyId);

    Optional<Payout> findByIdAndPayoutAgency_Id(Long id, Long agencyId);
}
