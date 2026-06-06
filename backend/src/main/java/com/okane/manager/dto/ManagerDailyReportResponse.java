package com.okane.manager.dto;

import java.util.List;

public record ManagerDailyReportResponse(
        ManagerReportSummaryResponse summary,
        List<ManagerTransferReportLine> transfers
) {}