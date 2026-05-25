package com.okane.currencyfx.dto;

import java.math.BigDecimal;

public record ExchangeRateResponse(
        String fromCurrency,
        String toCurrency,
        BigDecimal rate
) {
}
