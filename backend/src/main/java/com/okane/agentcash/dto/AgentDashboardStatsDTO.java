package com.okane.agentcash.dto;

import java.math.BigDecimal;

public record AgentDashboardStatsDTO(
        BigDecimal soldeCaisse,
        long transfertsJour,
        long paiementsJour,
        long transfertsEnAttente,
        long paiementsEnAttente,
        BigDecimal revenus,
        String devise
) {
}
