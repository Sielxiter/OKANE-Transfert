package com.okane.currencyfx.repository;

import com.okane.currencyfx.entity.ExchangeRate;
import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;

public interface ExchangeRateRepository extends JpaRepository<ExchangeRate, Long> {
    Optional<ExchangeRate> findByFromCurrency_IdAndToCurrency_Id(Long fromCurrencyId, Long toCurrencyId);

    Optional<ExchangeRate> findTopByFromCurrency_IdAndToCurrency_IdOrderByEffectiveAtDesc(Long fromCurrencyId, Long toCurrencyId);
}
