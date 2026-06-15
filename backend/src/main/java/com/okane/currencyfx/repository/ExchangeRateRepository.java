package com.okane.currencyfx.repository;

import com.okane.currencyfx.entity.ExchangeRate;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;

public interface ExchangeRateRepository extends JpaRepository<ExchangeRate, Long> {
    Optional<ExchangeRate> findByFromCurrency_IdAndToCurrency_Id(Long fromCurrencyId, Long toCurrencyId);

    Optional<ExchangeRate> findFirstByFromCurrency_IdAndToCurrency_IdOrderByEffectiveAtDescIdDesc(
            Long fromCurrencyId,
            Long toCurrencyId
    );

    /**
     * Returns every recorded rate for the given currency pair, newest first.
     * Used by {@code getExchangeRateHistory()} to derive the rate history (each
     * row represents a previous "version" of the rate).
     */
    List<ExchangeRate> findByFromCurrency_IdAndToCurrency_IdOrderByEffectiveAtDescIdDesc(
            Long fromCurrencyId,
            Long toCurrencyId
    );

    /**
     * Returns the latest {@code ExchangeRate} entries platform-wide, used by
     * the admin FX history view. Pageable allows trimming to the latest N.
     */
    List<ExchangeRate> findAllByOrderByEffectiveAtDescIdDesc(Pageable pageable);

    long countByEffectiveAtBetween(LocalDateTime start, LocalDateTime end);

    Optional<ExchangeRate> findFirstByOrderByEffectiveAtDescIdDesc();
}
