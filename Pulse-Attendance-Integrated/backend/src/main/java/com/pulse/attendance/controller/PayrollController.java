package com.pulse.attendance.controller;

import com.pulse.attendance.dto.ApiResponse;
import com.pulse.attendance.dto.PayrollResponse;
import com.pulse.attendance.service.PayrollService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.security.access.prepost.PreAuthorize;

import java.time.YearMonth;
import java.util.List;

@RestController
@RequestMapping("/api/v1/payroll")
@RequiredArgsConstructor
@Tag(name = "Payroll")
@PreAuthorize("hasAnyRole('ADMIN','MANAGER')")
public class PayrollController {
    private final PayrollService payrollService;

    @PostMapping("/generate") @Operation(summary = "Generate payroll")
    public ResponseEntity<ApiResponse<PayrollResponse>> generatePayroll(@RequestParam Long employeeId, @RequestParam("month") String month, @RequestParam Integer actualWorkingDays) {
        return ResponseEntity.status(HttpStatus.CREATED).body(ApiResponse.success("Payroll generated successfully", payrollService.generatePayroll(employeeId, YearMonth.parse(month), actualWorkingDays)));
    }
    @GetMapping("/{id}") @Operation(summary = "Get payroll by ID")
    public ResponseEntity<ApiResponse<PayrollResponse>> getPayrollById(@PathVariable Long id) {
        return ResponseEntity.ok(ApiResponse.success("Payroll retrieved successfully", payrollService.getPayrollById(id)));
    }
    @GetMapping("/employee/{employeeId}") @Operation(summary = "Get payroll by employee")
    public ResponseEntity<ApiResponse<List<PayrollResponse>>> getPayrollByEmployeeId(@PathVariable Long employeeId) {
        return ResponseEntity.ok(ApiResponse.success("Payroll records retrieved successfully", payrollService.getPayrollByEmployeeId(employeeId)));
    }
    @GetMapping("/employee/{employeeId}/month/{month}") @Operation(summary = "Get payroll by employee and month")
    public ResponseEntity<ApiResponse<PayrollResponse>> getPayrollByEmployeeAndMonth(@PathVariable Long employeeId, @PathVariable String month) {
        return ResponseEntity.ok(ApiResponse.success("Payroll retrieved successfully", payrollService.getPayrollByEmployeeAndMonth(employeeId, YearMonth.parse(month))));
    }
    @GetMapping("/month/{month}") @Operation(summary = "Get payroll by month")
    public ResponseEntity<ApiResponse<List<PayrollResponse>>> getPayrollByMonth(@PathVariable String month) {
        return ResponseEntity.ok(ApiResponse.success("Payroll records retrieved successfully", payrollService.getPayrollByMonth(YearMonth.parse(month))));
    }
    @GetMapping @Operation(summary = "Get all payroll")
    public ResponseEntity<ApiResponse<List<PayrollResponse>>> getAllPayroll() {
        return ResponseEntity.ok(ApiResponse.success("Payroll records retrieved successfully", payrollService.getAllPayroll()));
    }
    @DeleteMapping("/{id}") @Operation(summary = "Delete payroll")
    public ResponseEntity<ApiResponse<Void>> deletePayroll(@PathVariable Long id) {
        payrollService.deletePayroll(id);
        return ResponseEntity.ok(ApiResponse.success("Payroll deleted successfully", null));
    }
}
