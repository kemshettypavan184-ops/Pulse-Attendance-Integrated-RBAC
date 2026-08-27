package com.pulse.attendance.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import java.time.LocalDate;
import java.time.YearMonth;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class PayrollResponse {
    private Long id;
    private Long employeeId;
    private String employeeName;
    private YearMonth month;
    private Double baseSalary;
    private Integer totalWorkingDays;
    private Integer actualWorkingDays;
    private Integer leaveDays;
    private Double grossSalary;
    private Double deductions;
    private Double netSalary;
    private String remarks;
    private LocalDate createdAt;
    private LocalDate updatedAt;
}
