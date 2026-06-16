package com.okane.cash.repository;

import com.okane.cash.entity.FundDiscrepancy;
import java.util.List;
import org.springframework.data.jpa.repository.JpaRepository;

public interface FundDiscrepancyRepository extends JpaRepository<FundDiscrepancy, Long> {
    List<FundDiscrepancy> findByCashSession_Agency_IdInOrderByReportedAtDesc(List<Long> agencyIds);
}
