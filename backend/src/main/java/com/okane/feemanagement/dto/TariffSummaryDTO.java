package com.okane.feemanagement.dto;

public record TariffSummaryDTO(
        long totalLines,
        long fixedLines,
        long percentageLines,
        long simulationsToday
) {
}
