package com.okane.managermodule.dto;

import java.math.BigDecimal;

public record UpdateDailyLimitRequest(
        BigDecimal dailyLimit
) {}
