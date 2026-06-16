package com.okane.agencybalance.dto;

import java.math.BigDecimal;
import java.time.LocalDateTime;

public record CashMovementDto(
    Long id,
    String movementType,
    BigDecimal amount,
    String description,
    LocalDateTime createdAt,
    Long transferId,
    Long payoutId,
    String agentName
) {}
