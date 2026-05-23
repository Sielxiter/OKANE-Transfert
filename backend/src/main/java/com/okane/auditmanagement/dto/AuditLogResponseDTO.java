package com.okane.auditmanagement.dto;

import com.okane.auditmanagement.domain.AuditLogStatus;
import com.okane.auditmanagement.domain.AuditModule;
import com.okane.auditmanagement.domain.AuditRiskLevel;

public class AuditLogResponseDTO {

    private Long id;
    private String createdAt;
    private String actorId;
    private String actorName;
    private String actorEmail;
    private String actorRole;
    private String action;
    private AuditModule module;
    private String target;
    private String ipAddress;
    private AuditLogStatus status;
    private AuditRiskLevel riskLevel;
    private String description;

    public AuditLogResponseDTO() {
    }

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public String getCreatedAt() { return createdAt; }
    public void setCreatedAt(String createdAt) { this.createdAt = createdAt; }

    public String getActorId() { return actorId; }
    public void setActorId(String actorId) { this.actorId = actorId; }

    public String getActorName() { return actorName; }
    public void setActorName(String actorName) { this.actorName = actorName; }

    public String getActorEmail() { return actorEmail; }
    public void setActorEmail(String actorEmail) { this.actorEmail = actorEmail; }

    public String getActorRole() { return actorRole; }
    public void setActorRole(String actorRole) { this.actorRole = actorRole; }

    public String getAction() { return action; }
    public void setAction(String action) { this.action = action; }

    public AuditModule getModule() { return module; }
    public void setModule(AuditModule module) { this.module = module; }

    public String getTarget() { return target; }
    public void setTarget(String target) { this.target = target; }

    public String getIpAddress() { return ipAddress; }
    public void setIpAddress(String ipAddress) { this.ipAddress = ipAddress; }

    public AuditLogStatus getStatus() { return status; }
    public void setStatus(AuditLogStatus status) { this.status = status; }

    public AuditRiskLevel getRiskLevel() { return riskLevel; }
    public void setRiskLevel(AuditRiskLevel riskLevel) { this.riskLevel = riskLevel; }

    public String getDescription() { return description; }
    public void setDescription(String description) { this.description = description; }
}
