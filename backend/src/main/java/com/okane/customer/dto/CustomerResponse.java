package com.okane.customer.dto;

public record CustomerResponse(
        String id,
        String prenom,
        String nom,
        String telephone,
        String pays,
        String typePiece,
        String numeroPiece,
        String statutKyc,
        String creeLe
) {
}
