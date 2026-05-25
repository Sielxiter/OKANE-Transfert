package com.okane.manager.dto;

import java.util.List;

public record ManagerClientDetailResponse(
        ManagerClientResponse client,
        List<ManagerClientTransactionResponse> transactions
) {}