package com.okane.usermanagement.dto;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;

public record CreateUserRequestDTO(
        @NotBlank @Size(max = 100) String firstName,
        @NotBlank @Size(max = 100) String lastName,
        @NotBlank @Email @Size(max = 150) String email,
        @Size(max = 30) String phone,
        @NotBlank @Size(min = 8, max = 100) String password,
        @NotBlank @Pattern(
                regexp = "ROLE_(ADMIN|MANAGER|AGENT|CLIENT)",
                message = "role must be one of ROLE_ADMIN, ROLE_MANAGER, ROLE_AGENT, ROLE_CLIENT"
        ) String role,
        @Size(max = 100) String country,
        Long agencyId
) {
}
