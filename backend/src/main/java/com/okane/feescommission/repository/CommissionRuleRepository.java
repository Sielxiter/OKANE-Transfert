package com.okane.feescommission.repository;

import com.okane.feescommission.entity.CommissionRule;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.Optional;


public interface CommissionRuleRepository extends JpaRepository<CommissionRule, Long> {
	boolean existsByFeeGrid_Id(Long feeGridId);

    Optional<CommissionRule> findFirstByActiveTrueOrderByCreatedAtDesc();

    Optional<CommissionRule> findFirstByFeeGrid_Corridor_IdAndActiveTrue(Long corridorId);

    Optional<CommissionRule> findFirstByFeeGrid_ActiveTrueOrderByFeeGrid_CreatedAtDesc();
}
