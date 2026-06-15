package com.okane.compliancemanagement.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public class RejectKycRequestDTO {

    @NotBlank(message = "Le motif de rejet est obligatoire.")
    @Size(max = 255)
    private String reason;

    public RejectKycRequestDTO() {
    }

    public String getReason() { return reason; }
    public void setReason(String reason) { this.reason = reason; }
}
