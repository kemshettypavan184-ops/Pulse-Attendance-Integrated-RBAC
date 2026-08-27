package com.pulse.attendance.controller;

import com.pulse.attendance.dto.ApiResponse;
import com.pulse.attendance.dto.AttendanceRequest;
import com.pulse.attendance.dto.AttendanceResponse;
import com.pulse.attendance.service.AttendanceService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.security.access.prepost.PreAuthorize;

import java.time.LocalDate;
import java.util.List;

@RestController
@RequestMapping("/api/v1/attendance")
@RequiredArgsConstructor
@Tag(name = "Attendance")
@PreAuthorize("hasAnyRole('ADMIN','MANAGER')")
public class AttendanceController {
    private final AttendanceService attendanceService;

    @PostMapping @Operation(summary = "Mark attendance")
    public ResponseEntity<ApiResponse<AttendanceResponse>> markAttendance(@Valid @RequestBody AttendanceRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED).body(ApiResponse.success("Attendance marked successfully", attendanceService.markAttendance(request)));
    }

    @GetMapping("/{id}") @Operation(summary = "Get attendance by ID")
    public ResponseEntity<ApiResponse<AttendanceResponse>> getAttendanceById(@PathVariable Long id) {
        return ResponseEntity.ok(ApiResponse.success("Attendance retrieved successfully", attendanceService.getAttendanceById(id)));
    }

    @GetMapping("/employee/{employeeId}") @Operation(summary = "Get attendance by employee and date range")
    public ResponseEntity<ApiResponse<List<AttendanceResponse>>> getAttendanceByEmployeeAndDateRange(@PathVariable Long employeeId, @RequestParam LocalDate startDate, @RequestParam LocalDate endDate) {
        return ResponseEntity.ok(ApiResponse.success("Attendance retrieved successfully", attendanceService.getAttendanceByEmployeeAndDateRange(employeeId, startDate, endDate)));
    }

    @GetMapping("/date/{date}") @Operation(summary = "Get attendance by date")
    public ResponseEntity<ApiResponse<List<AttendanceResponse>>> getAttendanceByDate(@PathVariable LocalDate date) {
        return ResponseEntity.ok(ApiResponse.success("Attendance retrieved successfully", attendanceService.getAttendanceByDate(date)));
    }

    @GetMapping @Operation(summary = "Get all attendance")
    public ResponseEntity<ApiResponse<List<AttendanceResponse>>> getAllAttendance() {
        return ResponseEntity.ok(ApiResponse.success("Attendance retrieved successfully", attendanceService.getAllAttendance()));
    }

    @PutMapping("/{id}") @Operation(summary = "Update attendance")
    public ResponseEntity<ApiResponse<AttendanceResponse>> updateAttendance(@PathVariable Long id, @Valid @RequestBody AttendanceRequest request) {
        return ResponseEntity.ok(ApiResponse.success("Attendance updated successfully", attendanceService.updateAttendance(id, request)));
    }

    @DeleteMapping("/{id}") @Operation(summary = "Delete attendance")
    public ResponseEntity<ApiResponse<Void>> deleteAttendance(@PathVariable Long id) {
        attendanceService.deleteAttendance(id);
        return ResponseEntity.ok(ApiResponse.success("Attendance deleted successfully", null));
    }
}
