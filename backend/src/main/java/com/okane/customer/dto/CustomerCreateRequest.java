package com.okane.customer.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;

public record CustomerCreateRequest(
        @NotBlank String prenom,
        @NotBlank String nom,
        @NotBlank String telephone,
        @NotBlank String pays,
        @NotBlank @Pattern(regexp = "^(CIN|Passeport)$") String typePiece,
        @NotBlank String numeroPiece
) {
}
