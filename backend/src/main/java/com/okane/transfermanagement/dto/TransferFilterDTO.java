package com.okane.transfermanagement.dto;

import com.okane.transfermanagement.domain.TransferStatus;
import java.time.LocalDate;

/**
 * Read-only filter projection bound from query parameters by the controller.
 * Every field is optional; {@code null} means "no filter".
 */
public record TransferFilterDTO(
        String search,
        TransferStatus status,
        String currency,
        String sourceCountry,
        String destinationCountry,
        Long agentId,
        LocalDate dateFrom,
        LocalDate dateTo
) {
}
