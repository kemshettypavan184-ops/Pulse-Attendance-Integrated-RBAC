package com.pulse.attendance.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class DashboardStatsResponse {
    private long totalEmployees;
    private long present;
    private long late;
    private long absent;
    private long onLeave;
    private long pendingLeaves;
}
