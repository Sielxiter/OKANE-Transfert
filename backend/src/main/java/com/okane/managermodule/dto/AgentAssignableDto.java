package com.okane.managermodule.dto;

public record AgentAssignableDto(
        Long id,
        String fullName,
        String email,
        String phone,
        boolean currentlyAssigned
) {}
