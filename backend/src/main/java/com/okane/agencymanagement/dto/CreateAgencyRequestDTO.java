package com.okane.agencymanagement.dto;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;
import jakarta.validation.constraints.Size;
import java.math.BigDecimal;

public record CreateAgencyRequestDTO(
        @NotBlank @Size(max = 150) String name,
        @NotBlank @Size(max = 50) String code,
        @NotBlank @Size(max = 100) String city,
        @NotBlank @Size(max = 100) String country,
        @NotBlank @Size(max = 255) String address,
        @Size(max = 30) String phone,
        @Email @Size(max = 150) String email,
        @NotNull @Positive BigDecimal dailyLimit,
        String agencyType,
        Long centralAgencyId,
        Long managerId
) {
}
