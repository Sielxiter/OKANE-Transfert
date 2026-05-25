package com.okane.feescommission.repository;

import com.okane.feescommission.entity.CommissionRule;
import org.springframework.data.jpa.repository.JpaRepository;

public interface CommissionRuleRepository extends JpaRepository<CommissionRule, Long> {
	boolean existsByFeeGrid_Id(Long feeGridId);
}
