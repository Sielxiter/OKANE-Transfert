package com.okane.manager.dto;

import java.math.BigDecimal;

public record AgencyCashSummary(
        BigDecimal totalOpeningBalance,
        BigDecimal totalEntries,
        BigDecimal totalExits,
        BigDecimal totalCurrentBalance
) {}
