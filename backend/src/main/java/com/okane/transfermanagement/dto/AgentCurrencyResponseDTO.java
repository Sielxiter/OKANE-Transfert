package com.okane.transfermanagement.dto;

public record AgentCurrencyResponseDTO(
        Long id,
        String name,
        String symbol,
        Boolean active
) {
}
