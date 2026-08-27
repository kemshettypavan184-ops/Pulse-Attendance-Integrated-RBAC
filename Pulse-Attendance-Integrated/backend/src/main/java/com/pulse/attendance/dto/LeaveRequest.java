package com.pulse.attendance.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import com.pulse.attendance.enums.LeaveType;
import com.pulse.attendance.enums.LeaveStatus;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import java.time.LocalDate;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class LeaveRequest {
    private Long employeeId;

    @NotNull(message = "Leave type is required")
    private LeaveType leaveType;

    @NotNull(message = "Start date is required")
    private LocalDate startDate;

    @NotNull(message = "End date is required")
    private LocalDate endDate;

    // Calculated by the backend for employee self-service requests.
    private Integer numberOfDays;

    @NotBlank(message = "Reason is required")
    @Size(max = 2000, message = "Reason must not exceed 2000 characters")
    private String reason;

    private LeaveStatus status;
    private String comments;
}
