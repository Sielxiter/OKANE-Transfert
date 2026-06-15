package com.okane.compliancemanagement.repository;

import com.okane.compliance.entity.KycCheck;
import java.util.List;
import org.springframework.data.jpa.repository.JpaRepository;

public interface KycCheckRepository extends JpaRepository<KycCheck, Long> {

    List<KycCheck> findAllByOrderBySubmittedAtDesc();

    long countByStatus(String status);
}
