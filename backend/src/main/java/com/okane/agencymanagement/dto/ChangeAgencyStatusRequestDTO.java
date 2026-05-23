package com.okane.agencymanagement.dto;

import com.okane.agencymanagement.domain.AgencyStatus;
import jakarta.validation.constraints.NotNull;

public record ChangeAgencyStatusRequestDTO(
        @NotNull AgencyStatus status
) {
}
