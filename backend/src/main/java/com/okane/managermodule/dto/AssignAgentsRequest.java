package com.okane.managermodule.dto;

import java.util.List;

public record AssignAgentsRequest(
        List<Long> agentIds
) {}
