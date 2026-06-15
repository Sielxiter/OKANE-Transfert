package com.okane.clientmodule.dto;

import java.time.LocalDateTime;

public record TransferStatusHistoryDTO(
        String status,
        String label,
        String description,
        LocalDateTime createdAt
) {
}
