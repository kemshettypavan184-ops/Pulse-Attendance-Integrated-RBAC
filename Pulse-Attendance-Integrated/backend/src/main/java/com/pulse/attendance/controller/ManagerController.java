package com.pulse.attendance.controller;

import com.pulse.attendance.dto.ApiResponse;
import com.pulse.attendance.dto.AttendanceResponse;
import com.pulse.attendance.dto.LeaveResponse;
import com.pulse.attendance.service.ManagerService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.security.access.prepost.PreAuthorize;

import java.time.LocalDate;
import java.util.List;

@RestController
@RequestMapping("/api/v1/manager")
@RequiredArgsConstructor
@Tag(name = "Manager")
@PreAuthorize("hasAnyRole('ADMIN','MANAGER')")
public class ManagerController {
    private final ManagerService managerService;

    @GetMapping("/team-attendance") @Operation(summary = "Get team attendance")
    public ResponseEntity<ApiResponse<List<AttendanceResponse>>> getTeamAttendance(@RequestParam String managerName, @RequestParam LocalDate startDate, @RequestParam LocalDate endDate) {
        return ResponseEntity.ok(ApiResponse.success("Team attendance retrieved successfully", managerService.getTeamAttendance(managerName, startDate, endDate)));
    }
    @GetMapping("/team-leave-requests") @Operation(summary = "Get team leave requests")
    public ResponseEntity<ApiResponse<List<LeaveResponse>>> getTeamLeaveRequests(@RequestParam String managerName) {
        return ResponseEntity.ok(ApiResponse.success("Team leave requests retrieved successfully", managerService.getTeamLeaveRequests(managerName)));
    }
    @PutMapping("/approve-leave/{leaveId}") @Operation(summary = "Approve team leave")
    public ResponseEntity<ApiResponse<Void>> approveLeave(@PathVariable Long leaveId, @RequestParam String managerName) {
        managerService.approveLeave(leaveId, managerName);
        return ResponseEntity.ok(ApiResponse.success("Leave approved successfully", null));
    }
    @PutMapping("/reject-leave/{leaveId}") @Operation(summary = "Reject team leave")
    public ResponseEntity<ApiResponse<Void>> rejectLeave(@PathVariable Long leaveId) {
        managerService.rejectLeave(leaveId);
        return ResponseEntity.ok(ApiResponse.success("Leave rejected successfully", null));
    }
}
