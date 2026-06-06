package com.okane.manager.dto;

import java.time.LocalDateTime;

public record ManagerAgentResponse(
        Long id,
        String prenom,
        String nom,
        String email,
        String telephone,
        Boolean actif,
        String role,
        String agencyName,
        LocalDateTime creeLe,
        LocalDateTime modifieLe
) {}
