package com.okane.currencyfx.repository;

import com.okane.currencyfx.entity.Currency;
import java.util.List;
import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;

public interface CurrencyRepository extends JpaRepository<Currency, Long> {
    Optional<Currency> findByCode(String code);

    boolean existsByCodeIgnoreCase(String code);

    long countByActive(boolean active);

    List<Currency> findAllByOrderByCodeAsc();
}
