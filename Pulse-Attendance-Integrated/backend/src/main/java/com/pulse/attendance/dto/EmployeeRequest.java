package com.pulse.attendance.dto;

import com.pulse.attendance.enums.EmployeeStatus;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.PositiveOrZero;

import java.time.LocalDate;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class EmployeeRequest {

    @NotBlank(message = "employeeId is required")
    private String employeeId;

    @NotBlank(message = "fullName is required")
    private String fullName;

    @NotBlank(message = "email is required")
    @Email(message = "email must be valid")
    private String email;

    private String phoneNumber;

    @NotNull(message = "dateOfBirth is required")
    private LocalDate dateOfBirth;

    @NotNull(message = "joinDate is required")
    private LocalDate joinDate;

    private String department;

    private String designation;

    @NotNull(message = "status is required")
    private EmployeeStatus status;

    private String reportingManager;

    private Long managerId;

    @NotNull(message = "salary is required")
    @PositiveOrZero(message = "salary must be zero or positive")
    private Double salary;
}