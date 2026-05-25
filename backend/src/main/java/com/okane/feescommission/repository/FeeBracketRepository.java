package com.okane.feescommission.repository;

import com.okane.feescommission.entity.FeeBracket;
import java.math.BigDecimal;
import org.springframework.data.jpa.repository.JpaRepository;

public interface FeeBracketRepository extends JpaRepository<FeeBracket, Long> {
	boolean existsByFeeGrid_IdAndMinAmountAndMaxAmountAndFeeTypeAndFeeValue(
			Long feeGridId,
			BigDecimal minAmount,
			BigDecimal maxAmount,
			String feeType,
			BigDecimal feeValue
	);
}
