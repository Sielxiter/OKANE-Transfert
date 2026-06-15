package com.okane.transfermanagement.dto;

public record AgentCountryResponseDTO(
        Long id,
        String code,
        String name,
        String currencyCode,
        String phoneCode
) {
}
