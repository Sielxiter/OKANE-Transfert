package com.okane.manager.dto;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

public record ManagerAgentUpdateRequest(
        @NotBlank(message = "Le prénom est obligatoire")
        @Size(min = 2, max = 100)
        String prenom,

        @NotBlank(message = "Le nom est obligatoire")
        @Size(min = 2, max = 100)
        String nom,

        @NotBlank(message = "L'email est obligatoire")
        @Email(message = "Format d'email invalide")
        String email,

        @Size(max = 30)
        String telephone,

        @NotNull(message = "Le statut actif est obligatoire")
        Boolean actif
) {}