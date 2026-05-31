package com.okane.cash.repository;

import com.okane.cash.entity.FundDiscrepancy;

import java.util.List;
import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;

public interface FundDiscrepancyRepository extends JpaRepository<FundDiscrepancy, Long> {
    Optional<FundDiscrepancy> findByCashSession_Id(Long sessionId);
    List<FundDiscrepancy> findByCashSession_Agency_IdOrderByReportedAtDesc(Long agencyId);
    List<FundDiscrepancy> findByCashSession_Agency_IdAndStatus(Long agencyId, String status);
    long countByCashSession_Agency_IdAndStatus(Long agencyId, String status);
}
