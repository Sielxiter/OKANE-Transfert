package com.okane.managermodule.service;

import java.util.List;

public class ManagerScope {
    private final Long managerId;
    private final Long centralAgencyId;
    private final List<Long> subAgencyIds;
    private final String managerEmail;

    public ManagerScope(Long managerId, Long centralAgencyId, List<Long> subAgencyIds, String managerEmail) {
        this.managerId = managerId;
        this.centralAgencyId = centralAgencyId;
        this.subAgencyIds = subAgencyIds;
        this.managerEmail = managerEmail;
    }

    public Long getManagerId() { return managerId; }
    public Long getCentralAgencyId() { return centralAgencyId; }
    public List<Long> getSubAgencyIds() { return subAgencyIds; }
    public String getManagerEmail() { return managerEmail; }
}
