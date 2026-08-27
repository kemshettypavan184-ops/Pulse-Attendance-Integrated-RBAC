package com.pulse.attendance.controller;

import com.pulse.attendance.dto.ApiResponse;
import com.pulse.attendance.dto.LeaveRequest;
import com.pulse.attendance.dto.LeaveResponse;
import com.pulse.attendance.service.LeaveService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.security.core.Authentication;
import org.springframework.security.access.prepost.PreAuthorize;

import java.time.LocalDate;
import java.util.List;

@RestController
@RequestMapping("/api/v1/leaves")
@RequiredArgsConstructor
@Tag(name = "Leaves")
@PreAuthorize("hasAnyRole('ADMIN','MANAGER')")
public class LeaveController {
    private final LeaveService leaveService;

    @PostMapping @Operation(summary = "Apply for leave")
    public ResponseEntity<ApiResponse<LeaveResponse>> applyLeave(@Valid @RequestBody LeaveRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED).body(ApiResponse.success("Leave applied successfully", leaveService.applyLeave(request)));
    }
    @GetMapping("/{id}") @Operation(summary = "Get leave by ID")
    public ResponseEntity<ApiResponse<LeaveResponse>> getLeaveById(@PathVariable Long id) {
        return ResponseEntity.ok(ApiResponse.success("Leave retrieved successfully", leaveService.getLeaveById(id)));
    }
    @GetMapping("/employee/{employeeId}") @Operation(summary = "Get leave by employee")
    public ResponseEntity<ApiResponse<List<LeaveResponse>>> getLeaveByEmployeeId(@PathVariable Long employeeId) {
        return ResponseEntity.ok(ApiResponse.success("Leave records retrieved successfully", leaveService.getLeaveByEmployeeId(employeeId)));
    }
    @GetMapping("/employee/{employeeId}/date-range") @Operation(summary = "Get leave by employee and date range")
    public ResponseEntity<ApiResponse<List<LeaveResponse>>> getLeaveByEmployeeAndDateRange(@PathVariable Long employeeId, @RequestParam LocalDate startDate, @RequestParam LocalDate endDate) {
        return ResponseEntity.ok(ApiResponse.success("Leave records retrieved successfully", leaveService.getLeaveByEmployeeAndDateRange(employeeId, startDate, endDate)));
    }
    @GetMapping("/pending") @Operation(summary = "Get pending leaves")
    public ResponseEntity<ApiResponse<List<LeaveResponse>>> getPendingLeaves() {
        return ResponseEntity.ok(ApiResponse.success("Pending leaves retrieved successfully", leaveService.getPendingLeaves()));
    }
    @GetMapping @Operation(summary = "Get all leaves")
    public ResponseEntity<ApiResponse<List<LeaveResponse>>> getAllLeaves() {
        return ResponseEntity.ok(ApiResponse.success("Leaves retrieved successfully", leaveService.getAllLeaves()));
    }
    @PutMapping("/{id}/approve") @Operation(summary = "Approve leave")
    public ResponseEntity<ApiResponse<LeaveResponse>> approveLeave(@PathVariable Long id, Authentication authentication) {
        return ResponseEntity.ok(ApiResponse.success(
                "Leave approved successfully",
                leaveService.approveLeave(id, authentication.getName())));
    }
    @PutMapping("/{id}/reject") @Operation(summary = "Reject leave")
    public ResponseEntity<ApiResponse<LeaveResponse>> rejectLeave(@PathVariable Long id) {
        return ResponseEntity.ok(ApiResponse.success("Leave rejected successfully", leaveService.rejectLeave(id)));
    }
    @DeleteMapping("/{id}") @Operation(summary = "Delete leave")
    public ResponseEntity<ApiResponse<Void>> deleteLeave(@PathVariable Long id) {
        leaveService.deleteLeave(id);
        return ResponseEntity.ok(ApiResponse.success("Leave deleted successfully", null));
    }
}
