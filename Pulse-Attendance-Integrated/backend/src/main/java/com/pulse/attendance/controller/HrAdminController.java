package com.pulse.attendance.controller;

import com.pulse.attendance.dto.ApiResponse;
import com.pulse.attendance.dto.EmployeeResponse;
import com.pulse.attendance.dto.LeaveResponse;
import com.pulse.attendance.service.HrAdminService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.security.access.prepost.PreAuthorize;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/v1/hr-admin")
@RequiredArgsConstructor
@Tag(name = "HR Admin")
@PreAuthorize("hasRole('ADMIN')")
public class HrAdminController {
    private final HrAdminService hrAdminService;

    @GetMapping("/all-employees") @Operation(summary = "Get all employees for HR")
    public ResponseEntity<ApiResponse<List<EmployeeResponse>>> getAllEmployees() {
        return ResponseEntity.ok(ApiResponse.success("Employees retrieved successfully", hrAdminService.getAllEmployees()));
    }
    @GetMapping("/all-leave-requests") @Operation(summary = "Get all leave requests")
    public ResponseEntity<ApiResponse<List<LeaveResponse>>> getAllLeaveRequests() {
        return ResponseEntity.ok(ApiResponse.success("Leave requests retrieved successfully", hrAdminService.getAllLeaveRequests()));
    }
    @GetMapping("/pending-leave-requests") @Operation(summary = "Get pending leave requests")
    public ResponseEntity<ApiResponse<List<LeaveResponse>>> getPendingLeaveRequests() {
        return ResponseEntity.ok(ApiResponse.success("Pending leave requests retrieved successfully", hrAdminService.getPendingLeaveRequests()));
    }
    @PostMapping("/approve-all-pending-leaves") @Operation(summary = "Approve all pending leaves")
    public ResponseEntity<ApiResponse<Void>> approveAllPendingLeaves(@RequestParam String approvedBy) {
        hrAdminService.approveAllPendingLeaves(approvedBy);
        return ResponseEntity.ok(ApiResponse.success("All pending leaves approved successfully", null));
    }
    @GetMapping("/dashboard-stats") @Operation(summary = "Get HR dashboard statistics")
    public ResponseEntity<ApiResponse<Map<String, Long>>> getDashboardStats() {
        Map<String, Long> stats = new HashMap<>();
        stats.put("totalEmployees", hrAdminService.getEmployeeCount());
        stats.put("pendingLeaves", hrAdminService.getPendingLeaveCount());
        return ResponseEntity.ok(ApiResponse.success("Dashboard statistics retrieved successfully", stats));
    }
}
