package com.okane.reportmanagement.repository;

import com.okane.reporting.entity.GeneratedReport;
import java.util.List;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;

public interface GeneratedReportRepository
        extends JpaRepository<GeneratedReport, Long>, JpaSpecificationExecutor<GeneratedReport> {

    List<GeneratedReport> findAllByOrderByGeneratedAtDesc();

    long countByStatus(String status);
}
