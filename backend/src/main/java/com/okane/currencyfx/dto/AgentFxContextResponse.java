package com.okane.currencyfx.dto;

public record AgentFxContextResponse(
        String sourceCountryCode,
        String sourceCountryName,
        String sourceCurrencyCode
) {
}
