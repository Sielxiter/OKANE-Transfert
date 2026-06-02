package com.okane.cash.repository;

import com.okane.cash.entity.FundDiscrepancy;

import java.util.List;
import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

public interface FundDiscrepancyRepository extends JpaRepository<FundDiscrepancy, Long> {
    Optional<FundDiscrepancy> findByCashSession_Id(Long sessionId);
    List<FundDiscrepancy> findByCashSession_Agency_IdOrderByReportedAtDesc(Long agencyId);
    List<FundDiscrepancy> findByCashSession_Agency_IdAndStatus(Long agencyId, String status);
    long countByCashSession_Agency_IdAndStatus(Long agencyId, String status);
    @Query("SELECT DISTINCT d FROM FundDiscrepancy d " +
            "LEFT JOIN FETCH d.cashSession s " +
            "LEFT JOIN FETCH s.agent " +
            "WHERE s.agency.id = :agencyId " +
            "ORDER BY d.reportedAt DESC")
    List<FundDiscrepancy> findByCashSession_Agency_IdOrderByReportedAtDescWithFetch(@Param("agencyId") Long agencyId);

    @Query("SELECT DISTINCT d FROM FundDiscrepancy d " +
            "LEFT JOIN FETCH d.cashSession s " +
            "LEFT JOIN FETCH s.agent " +
            "WHERE s.agency.id = :agencyId AND d.status = :status " +
            "ORDER BY d.reportedAt DESC")
    List<FundDiscrepancy> findByCashSession_Agency_IdAndStatusWithFetch(@Param("agencyId") Long agencyId, @Param("status") String status);
}
