package com.okane.feescommission.repository;

import com.okane.feescommission.entity.FeeBracket;
import java.math.BigDecimal;
import java.util.List;
import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;

public interface FeeBracketRepository extends JpaRepository<FeeBracket, Long> {
	boolean existsByFeeGrid_IdAndMinAmountAndMaxAmountAndFeeTypeAndFeeValue(
			Long feeGridId,
			BigDecimal minAmount,
			BigDecimal maxAmount,
			String feeType,
			BigDecimal feeValue
	);

	List<FeeBracket> findByFeeGrid_IdOrderByMinAmountAsc(Long feeGridId);

	Optional<FeeBracket> findFirstByFeeGrid_IdOrderByMinAmountAsc(Long feeGridId);
}
