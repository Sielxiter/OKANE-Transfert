package com.okane.clientmodule.dto;

import jakarta.validation.constraints.NotBlank;

public record ClientKycVerificationRequestDTO(
        @NotBlank String documentType,
        @NotBlank String imageBase64,
        String fileName,
        String mimeType
) {
}
