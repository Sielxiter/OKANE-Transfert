package com.okane.manager.dto;

public record ManagerClientResponse(
        String id,
        String prenom,
        String nom,
        String telephone,
        String pays,
        String typePiece,
        String numeroPiece,
        String statutKyc,
        String creeLe
) {}