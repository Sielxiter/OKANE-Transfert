package com.okane.currencymanagement.service;

import com.okane.auth.exception.ApiException;
import com.okane.currencyfx.entity.Currency;
import com.okane.currencyfx.entity.ExchangeRate;
import com.okane.currencyfx.repository.CurrencyRepository;
import com.okane.currencyfx.repository.ExchangeRateRepository;
import com.okane.currencymanagement.dto.FxSyncResultDTO;
import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.concurrent.locks.ReentrantLock;
import java.util.stream.Collectors;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.PlatformTransactionManager;
import org.springframework.transaction.support.TransactionTemplate;

@Service
public class ExchangeRateSyncService {

    private static final Logger log = LoggerFactory.getLogger(ExchangeRateSyncService.class);
    private static final String MAD = "MAD";
    private static final String SOURCE = "FRANKFURTER";
    private static final int RATE_SCALE = 6;

    private final CurrencyRepository currencyRepository;
    private final ExchangeRateRepository exchangeRateRepository;
    private final FrankfurterRateClient rateClient;
    private final TransactionTemplate transactionTemplate;
    private final ReentrantLock lock = new ReentrantLock();

    public ExchangeRateSyncService(
            CurrencyRepository currencyRepository,
            ExchangeRateRepository exchangeRateRepository,
            FrankfurterRateClient rateClient,
            PlatformTransactionManager transactionManager
    ) {
        this.currencyRepository = currencyRepository;
        this.exchangeRateRepository = exchangeRateRepository;
        this.rateClient = rateClient;
        this.transactionTemplate = new TransactionTemplate(transactionManager);
    }

    public FxSyncResultDTO synchronizeNow() {
        return synchronize(true);
    }

    public FxSyncResultDTO synchronizeQuietly() {
        try {
            return synchronize(false);
        } catch (RuntimeException ex) {
            log.warn("Scheduled FX sync failed: {}", ex.getMessage(), ex);
            return new FxSyncResultDTO(
                    false,
                    SOURCE,
                    LocalDateTime.now(),
                    0,
                    0,
                    List.of(),
                    "Synchronisation FX ignoree: " + safeMessage(ex)
            );
        }
    }

    private FxSyncResultDTO synchronize(boolean failIfBusy) {
        if (!lock.tryLock()) {
            if (failIfBusy) {
                throw new ApiException(HttpStatus.CONFLICT, "Une synchronisation FX est deja en cours.");
            }
            log.info("FX sync skipped because another run is already active.");
            return new FxSyncResultDTO(
                    true,
                    SOURCE,
                    LocalDateTime.now(),
                    0,
                    0,
                    List.of(),
                    "Synchronisation FX deja en cours."
            );
        }

        try {
            List<Currency> currencies = currencyRepository.findAllByOrderByNameAsc();
            Currency mad = currencyRepository.findBySymbolIgnoreCase(MAD)
                    .orElseThrow(() -> new ApiException(
                            HttpStatus.CONFLICT,
                            "La devise MAD doit exister pour synchroniser les taux."
                    ));

            List<String> quoteCodes = currencies.stream()
                    .map(Currency::getSymbol)
                    .filter(symbol -> symbol != null && symbol.matches("[A-Za-z]{3}"))
                    .map(symbol -> symbol.trim().toUpperCase(Locale.ROOT))
                    .filter(code -> !MAD.equals(code))
                    .distinct()
                    .collect(Collectors.toList());

            if (quoteCodes.isEmpty()) {
                return new FxSyncResultDTO(
                        true,
                        SOURCE,
                        LocalDateTime.now(),
                        0,
                        0,
                        List.of(),
                        "Aucune devise eligible a synchroniser."
                );
            }

            Map<String, BigDecimal> ratesByCode = rateClient.fetchRatesFromMad(quoteCodes);
            if (ratesByCode.isEmpty()) {
                throw new ApiException(HttpStatus.BAD_GATEWAY, "Impossible de recuperer les taux Frankfurter.");
            }

            List<String> skipped = new ArrayList<>();
            LocalDateTime now = LocalDateTime.now();
            Integer updated = transactionTemplate.execute(status -> {
                mad.setUpdatedAt(now);
                currencyRepository.save(mad);

                int count = 0;
                for (Currency currency : currencies) {
                    String symbol = currency.getSymbol();
                    if (symbol == null) {
                        continue;
                    }

                    String code = symbol.trim().toUpperCase(Locale.ROOT);
                    if (MAD.equals(code) || !code.matches("[A-Z]{3}")) {
                        continue;
                    }

                    BigDecimal madToQuote = ratesByCode.get(code);
                    if (madToQuote == null || madToQuote.compareTo(BigDecimal.ZERO) <= 0) {
                        skipped.add(code);
                        continue;
                    }

                    BigDecimal rateToMad = BigDecimal.ONE.divide(madToQuote, RATE_SCALE, RoundingMode.HALF_UP);
                    ExchangeRate exchangeRate = new ExchangeRate();
                    exchangeRate.setFromCurrency(currency);
                    exchangeRate.setToCurrency(mad);
                    exchangeRate.setRate(rateToMad);
                    exchangeRate.setSource(SOURCE);
                    exchangeRate.setEffectiveAt(now);
                    exchangeRateRepository.save(exchangeRate);
                    count++;
                }
                return count;
            });

            int updatedCount = updated == null ? 0 : updated;
            if (updatedCount == 0) {
                throw new ApiException(HttpStatus.BAD_GATEWAY, "Aucune devise n'a pu etre synchronisee.");
            }

            String message = "Synchronisation FX terminee: " + updatedCount + " devise(s) mise(s) a jour.";
            if (!skipped.isEmpty()) {
                message = message + " " + skipped.size() + " devise(s) ignoree(s).";
            }
            return new FxSyncResultDTO(
                    true,
                    SOURCE,
                    now,
                    updatedCount,
                    skipped.size(),
                    List.copyOf(skipped),
                    message
            );
        } finally {
            lock.unlock();
        }
    }

    private String safeMessage(RuntimeException ex) {
        String message = ex.getMessage();
        return message == null || message.isBlank() ? ex.getClass().getSimpleName() : message;
    }
}
