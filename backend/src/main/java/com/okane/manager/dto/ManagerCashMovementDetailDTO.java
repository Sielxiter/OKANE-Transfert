package com.okane.manager.dto;

import java.math.BigDecimal;
import java.time.LocalDateTime;

public record ManagerCashMovementDetailDTO(
        // Infos du mouvement
        Long movementId,
        String movementType,        // "IN" (entrée/encaissement) ou "OUT" (sortie/décaissement)
        BigDecimal amount,
        String currency,
        LocalDateTime createdAt,
        String processedBy,         // Agent qui a traité
        String transferReference,   // Référence du transfert

        // Infos de l'expéditeur (pour un encaissement - type IN)
        String senderName,
        String senderPhone,
        String senderCountry,

        // Infos du bénéficiaire (pour un décaissement - type OUT)
        String beneficiaryName,
        String beneficiaryPhone,
        String beneficiaryIdType,
        String beneficiaryIdNumber,

        // Statut
        String transferStatus
) {}