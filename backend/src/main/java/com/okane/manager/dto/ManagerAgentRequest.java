package com.okane.manager.dto;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

public record ManagerAgentRequest(
        @NotBlank(message = "Le prénom est obligatoire")
        @Size(min = 2, max = 100)
        String prenom,

        @NotBlank(message = "Le nom est obligatoire")
        @Size(min = 2, max = 100)
        String nom,

        @NotBlank(message = "L'email est obligatoire")
        @Email(message = "Format d'email invalide")
        String email,

        @NotBlank(message = "Le mot de passe est obligatoire")
        @Size(min = 6, message = "Le mot de passe doit contenir au moins 6 caractères")
        String motDePasse,

        @Size(max = 30)
        String telephone,

        @NotNull(message = "Le statut actif est obligatoire")
        Boolean actif
) {}