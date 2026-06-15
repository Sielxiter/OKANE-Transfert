package com.okane.currencymanagement.service;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

@Component
public class FxRateSyncScheduler {

    private static final Logger log = LoggerFactory.getLogger(FxRateSyncScheduler.class);

    private final ExchangeRateSyncService exchangeRateSyncService;

    public FxRateSyncScheduler(ExchangeRateSyncService exchangeRateSyncService) {
        this.exchangeRateSyncService = exchangeRateSyncService;
    }

    @Scheduled(fixedDelayString = "${fx.sync.interval-ms:60000}")
    public void syncRates() {
        try {
            exchangeRateSyncService.synchronizeQuietly();
        } catch (RuntimeException ex) {
            log.warn("FX scheduled sync failed: {}", ex.getMessage(), ex);
        }
    }
}
