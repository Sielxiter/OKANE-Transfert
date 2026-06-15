package com.okane.compliancemanagement.repository;

import com.okane.compliance.entity.ComplianceAlert;
import java.util.List;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

public interface ComplianceAlertRepository extends JpaRepository<ComplianceAlert, Long> {

    List<ComplianceAlert> findAllByOrderByCreatedAtDesc();

    List<ComplianceAlert> findByCustomer_IdOrderByCreatedAtDesc(Long customerId);

    long countByStatus(String status);

    // Scoped queries using subqueries (transferId is a Long column, not a JPA relationship)
    @Query("SELECT ca FROM ComplianceAlert ca WHERE ca.transferId IN (SELECT t.id FROM Transfer t WHERE t.sourceAgency.id IN :agencyIds) ORDER BY ca.createdAt DESC")
    List<ComplianceAlert> findByAgencyIdsOrderByCreatedAtDesc(@Param("agencyIds") List<Long> agencyIds);

    @Query("SELECT ca FROM ComplianceAlert ca WHERE ca.status = :status AND ca.transferId IN (SELECT t.id FROM Transfer t WHERE t.sourceAgency.id IN :agencyIds) ORDER BY ca.createdAt DESC")
    List<ComplianceAlert> findByStatusAndAgencyIdsOrderByCreatedAtDesc(@Param("status") String status, @Param("agencyIds") List<Long> agencyIds);

    @Query("SELECT COUNT(ca) FROM ComplianceAlert ca WHERE ca.status = :status AND ca.transferId IN (SELECT t.id FROM Transfer t WHERE t.sourceAgency.id IN :agencyIds)")
    long countByStatusAndAgencyIds(@Param("status") String status, @Param("agencyIds") List<Long> agencyIds);

    @Query("SELECT COUNT(ca) FROM ComplianceAlert ca WHERE ca.riskLevel = :riskLevel AND ca.status = :status AND ca.transferId IN (SELECT t.id FROM Transfer t WHERE t.sourceAgency.id IN :agencyIds)")
    long countByRiskLevelAndStatusAndAgencyIds(@Param("riskLevel") String riskLevel, @Param("status") String status, @Param("agencyIds") List<Long> agencyIds);
}
