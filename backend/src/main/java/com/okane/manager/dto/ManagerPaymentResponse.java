package com.okane.manager.dto;

public record ManagerPaymentResponse(
        String id,
        String transferReference,
        String withdrawalCode,
        String nomExpediteur,
        String nomBeneficiaire,
        String telephoneBeneficiaire,
        double montantPaye,
        String devise,
        String agencePaiement,
        String payePar,
        String payeLe,
        String transferStatut
) {}