package com.okane.transfer.repository;

import com.okane.transfer.entity.Transfer;
import java.time.LocalDateTime;
import java.util.Optional;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;

public interface TransferRepository extends JpaRepository<Transfer, Long>, JpaSpecificationExecutor<Transfer> {
    Optional<Transfer> findByReferenceCode(String referenceCode);

    Optional<Transfer> findByWithdrawalCode(String withdrawalCode);

    long countByCreatedAtBetween(LocalDateTime start, LocalDateTime end);

    long countByStatus(String status);

    Page<Transfer> findAllByOrderByCreatedAtDesc(Pageable pageable);
}
