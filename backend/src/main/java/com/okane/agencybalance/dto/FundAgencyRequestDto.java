package com.okane.agencybalance.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;
import jakarta.validation.constraints.Size;
import java.math.BigDecimal;

public record FundAgencyRequestDto(
    @NotNull @Positive BigDecimal amount,
    @NotBlank @Size(max = 255) String description,
    @NotNull String direction
) {}
