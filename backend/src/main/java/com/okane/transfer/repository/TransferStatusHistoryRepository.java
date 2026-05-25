package com.okane.transfer.repository;

import com.okane.transfer.entity.TransferStatusHistory;
import org.springframework.data.jpa.repository.JpaRepository;

public interface TransferStatusHistoryRepository extends JpaRepository<TransferStatusHistory, Long> {
}
