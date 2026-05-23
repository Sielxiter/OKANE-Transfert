package com.okane.compliancemanagement.dto;

import jakarta.validation.constraints.NotBlank;

public class ChangeAmlStatusRequestDTO {

    @NotBlank(message = "Le statut est obligatoire.")
    private String status;

    public ChangeAmlStatusRequestDTO() {
    }

    public String getStatus() { return status; }
    public void setStatus(String status) { this.status = status; }
}
