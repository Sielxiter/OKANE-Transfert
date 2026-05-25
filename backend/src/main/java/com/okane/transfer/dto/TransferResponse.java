package com.okane.transfer.dto;

public record TransferResponse(
        String id,
        String codeReference,
        String codeRetrait,
        String nomExpediteur,
        String telephoneExpediteur,
        String nomBeneficiaire,
        String telephoneBeneficiaire,
        String beneficiaryDocumentType,
        String beneficiaryDocumentNumber,
        String paysDestination,
        double montant,
        double montantFrais,
        double montantNet,
        String statut,
        String creeLe,
        String devise,
        String deviseSource,
        String deviseDestination
) {
}
