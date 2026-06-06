package com.okane.manager.dto;

public record ManagerTransferReportLine(
        String id,
        String codeReference,
        String nomExpediteur,
        String telephoneExpediteur,
        String nomBeneficiaire,
        String telephoneBeneficiaire,
        String paysDestination,
        double montant,
        double frais,
        double montantNet,
        double tauxChange,
        String deviseSource,
        String deviseDestination,
        String statut,
        String creeLe,
        String agentCreateur
) {}