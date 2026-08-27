package com.pulse.attendance.controller;

import com.pulse.attendance.dto.ApiResponse;
import com.pulse.attendance.dto.EmployeeRequest;
import com.pulse.attendance.dto.EmployeeResponse;
import com.pulse.attendance.dto.PageResponse;
import com.pulse.attendance.enums.EmployeeStatus;
import com.pulse.attendance.service.EmployeeService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.Parameter;
import io.swagger.v3.oas.annotations.responses.ApiResponses;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.validation.annotation.Validated;
import org.springframework.data.domain.Sort;
import org.springframework.web.bind.annotation.*;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.data.domain.PageRequest;

import java.util.List;

@RestController
@RequestMapping("/api/v1/employees")
@RequiredArgsConstructor
@Validated
@Tag(name = "Employees", description = "Employee management and advanced search APIs")
@PreAuthorize("hasAnyRole('ADMIN','MANAGER')")
public class EmployeeController {

    private final EmployeeService employeeService;

    @PostMapping
    @Operation(summary = "Create employee")
    public ResponseEntity<ApiResponse<EmployeeResponse>> createEmployee(@Valid @RequestBody EmployeeRequest request) {
        EmployeeResponse response = employeeService.createEmployee(request);
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.success("Employee created successfully", response));
    }

    @GetMapping("/{id}")
    @Operation(summary = "Get employee by database ID")
    public ResponseEntity<ApiResponse<EmployeeResponse>> getEmployeeById(@PathVariable Long id) {
        return ResponseEntity.ok(ApiResponse.success("Employee retrieved successfully", employeeService.getEmployeeById(id)));
    }

    @GetMapping("/employee-id/{employeeId}")
    @Operation(summary = "Get employee by employee ID")
    public ResponseEntity<ApiResponse<EmployeeResponse>> getEmployeeByEmployeeId(@PathVariable String employeeId) {
        return ResponseEntity.ok(ApiResponse.success("Employee retrieved successfully", employeeService.getEmployeeByEmployeeId(employeeId)));
    }

    @GetMapping
    @Operation(summary = "Get all employees")
    public ResponseEntity<ApiResponse<List<EmployeeResponse>>> getAllEmployees() {
        return ResponseEntity.ok(ApiResponse.success("Employees retrieved successfully", employeeService.getAllEmployees()));
    }

    @GetMapping("/department/{department}")
    @Operation(summary = "Get employees by department")
    public ResponseEntity<ApiResponse<List<EmployeeResponse>>> getEmployeesByDepartment(@PathVariable String department) {
        return ResponseEntity.ok(ApiResponse.success("Employees retrieved successfully", employeeService.getEmployeesByDepartment(department)));
    }

    @GetMapping("/search")
    @Operation(summary = "Advanced employee search", description = "Search employees using any combination of optional filters with sorting and pagination")
    @ApiResponses({
            @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "200", description = "Search completed successfully"),
            @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "400", description = "Invalid search or pagination parameters")
    })
    public ResponseEntity<ApiResponse<PageResponse<EmployeeResponse>>> searchEmployees(
            @Parameter(description = "Partial employee name, case-insensitive") @RequestParam(required = false) String name,
            @Parameter(description = "Partial employee ID") @RequestParam(required = false) String employeeId,
            @Parameter(description = "Partial email") @RequestParam(required = false) String email,
            @Parameter(description = "Partial department name") @RequestParam(required = false) String department,
            @Parameter(description = "Partial designation") @RequestParam(required = false) String designation,
            @Parameter(description = "Employee status") @RequestParam(required = false) EmployeeStatus status,
            @RequestParam(defaultValue = "0") @Min(value = 0, message = "page must be greater than or equal to 0") int page,
            @RequestParam(defaultValue = "10") @Min(value = 1, message = "size must be at least 1") @Max(value = 100, message = "size must not exceed 100") int size,
            @RequestParam(defaultValue = "fullName,asc") String sort) {

        String[] sortParts = sort.split(",", 2);
        String sortField = sortParts[0].trim();
        String direction = sortParts.length > 1 ? sortParts[1].trim() : "asc";

        if (!List.of("id", "employeeId", "fullName", "email", "department", "designation", "status", "joinDate", "createdAt").contains(sortField)) {
            throw new IllegalArgumentException("Invalid sort field: " + sortField);
        }

        Sort.Direction sortDirection;
        try {
            sortDirection = Sort.Direction.fromString(direction);
        } catch (IllegalArgumentException ex) {
            throw new IllegalArgumentException("sort direction must be asc or desc");
        }

        PageResponse<EmployeeResponse> response = employeeService.searchEmployees(
                name, employeeId, email, department, designation, status,
                PageRequest.of(page, size, Sort.by(sortDirection, sortField)));

        return ResponseEntity.ok(ApiResponse.success("Employee search completed successfully", response));
    }

    @PutMapping("/{id}")
    @Operation(summary = "Update employee")
    public ResponseEntity<ApiResponse<EmployeeResponse>> updateEmployee(@PathVariable Long id, @Valid @RequestBody EmployeeRequest request) {
        return ResponseEntity.ok(ApiResponse.success("Employee updated successfully", employeeService.updateEmployee(id, request)));
    }

    @DeleteMapping("/{id}")
    @Operation(summary = "Delete employee")
    public ResponseEntity<ApiResponse<Void>> deleteEmployee(@PathVariable Long id) {
        employeeService.deleteEmployee(id);
        return ResponseEntity.ok(ApiResponse.success("Employee deleted successfully", null));
    }
}
