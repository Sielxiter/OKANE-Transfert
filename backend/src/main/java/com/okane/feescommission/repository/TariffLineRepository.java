package com.okane.feescommission.repository;

import com.okane.feescommission.entity.TariffLine;
import java.util.List;
import org.springframework.data.jpa.repository.JpaRepository;

public interface TariffLineRepository extends JpaRepository<TariffLine, Long> {
    List<TariffLine> findAllByOrderByMinAmountAscMaxAmountAsc();
}
