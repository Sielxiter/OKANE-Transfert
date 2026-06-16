package com.okane.clientmodule.dto;

import java.time.LocalDateTime;

public record ClientKycVerificationResponseDTO(
        Long documentId,
        String kycStatus,
        String amlRiskLevel,
        boolean amlMatched,
        Double matchScore,
        String matchedEntityName,
        String source,
        String documentType,
        String extractedNom,
        String extractedPrenom,
        String extractedNumeroPiece,
        String extractedNationalite,
        Double confidence,
        LocalDateTime submittedAt,
        String message
) {
}
