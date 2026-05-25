package com.okane.manager.dto;

public record ManagerClientTransactionResponse(
        String transferId,
        String codeReference,
        String codeRetrait,
        String type,           // "ENVOI" | "RETRAIT"
        double montant,
        double frais,
        double montantNet,
        String deviseSource,
        String deviseDestination,
        String paysDestination,
        String statut,
        String creeLe
) {}