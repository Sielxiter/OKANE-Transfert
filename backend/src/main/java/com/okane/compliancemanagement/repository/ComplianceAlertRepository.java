package com.okane.compliancemanagement.repository;

import com.okane.compliance.entity.ComplianceAlert;
import java.util.List;
import org.springframework.data.jpa.repository.JpaRepository;

public interface ComplianceAlertRepository extends JpaRepository<ComplianceAlert, Long> {

    List<ComplianceAlert> findAllByOrderByCreatedAtDesc();

    List<ComplianceAlert> findByCustomer_IdOrderByCreatedAtDesc(Long customerId);

    long countByStatus(String status);
}
