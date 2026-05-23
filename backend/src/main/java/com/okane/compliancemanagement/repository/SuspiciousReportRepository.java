package com.okane.compliancemanagement.repository;

import com.okane.compliance.entity.SuspiciousReport;
import java.util.List;
import org.springframework.data.jpa.repository.JpaRepository;

public interface SuspiciousReportRepository extends JpaRepository<SuspiciousReport, Long> {

    List<SuspiciousReport> findAllByOrderByCreatedAtDesc();

    long countByAlertStatusNot(String status);

    long countByRiskLevelIn(List<String> riskLevels);
}
