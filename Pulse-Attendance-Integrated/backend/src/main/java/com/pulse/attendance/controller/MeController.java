package com.pulse.attendance.controller;

import com.pulse.attendance.dto.ApiResponse;
import com.pulse.attendance.dto.AttendanceResponse;
import com.pulse.attendance.dto.EmployeeResponse;
import com.pulse.attendance.dto.LeaveResponse;
import com.pulse.attendance.dto.LeaveRequest;
import com.pulse.attendance.enums.LeaveStatus;
import com.pulse.attendance.entity.AppUser;
import com.pulse.attendance.exception.ResourceNotFoundException;
import com.pulse.attendance.repository.AppUserRepository;
import com.pulse.attendance.service.AttendanceService;
import com.pulse.attendance.service.EmployeeService;
import com.pulse.attendance.service.LeaveService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.time.LocalDate;
import java.util.List;

@RestController
@RequestMapping("/api/v1/me")
@RequiredArgsConstructor
public class MeController {
    private final AppUserRepository userRepository;
    private final EmployeeService employeeService;
    private final AttendanceService attendanceService;
    private final LeaveService leaveService;

    @GetMapping("/profile")
    public ResponseEntity<ApiResponse<EmployeeResponse>> profile(Authentication authentication) {
        AppUser user = currentUser(authentication);
        if (user.getEmployeeId() == null) {
            throw new ResourceNotFoundException("No employee profile is linked to this account");
        }
        return ResponseEntity.ok(ApiResponse.success("Profile retrieved successfully", employeeService.getEmployeeById(user.getEmployeeId())));
    }

    @GetMapping("/attendance")
    public ResponseEntity<ApiResponse<List<AttendanceResponse>>> attendance(Authentication authentication) {
        AppUser user = currentUser(authentication);
        if (user.getEmployeeId() == null) {
            return ResponseEntity.ok(ApiResponse.success("No employee attendance is linked to this account", List.of()));
        }
        return ResponseEntity.ok(ApiResponse.success("Attendance retrieved successfully",
                attendanceService.getAttendanceByEmployeeAndDateRange(user.getEmployeeId(), LocalDate.now().minusMonths(1), LocalDate.now())));
    }

    @PostMapping("/attendance/check-in")
    public ResponseEntity<ApiResponse<AttendanceResponse>> checkIn(Authentication authentication) {
        AppUser user = currentUser(authentication);
        if (user.getEmployeeId() == null) {
            throw new ResourceNotFoundException("No employee profile is linked to this account");
        }
        return ResponseEntity.ok(ApiResponse.success(
                "Attendance check-in successful",
                attendanceService.checkIn(user.getEmployeeId())));
    }

    @org.springframework.web.bind.annotation.PutMapping("/attendance/check-out")
    public ResponseEntity<ApiResponse<AttendanceResponse>> checkOut(Authentication authentication) {
        AppUser user = currentUser(authentication);
        if (user.getEmployeeId() == null) {
            throw new ResourceNotFoundException("No employee profile is linked to this account");
        }
        return ResponseEntity.ok(ApiResponse.success(
                "Attendance check-out successful",
                attendanceService.checkOut(user.getEmployeeId())));
    }

    @org.springframework.web.bind.annotation.PostMapping("/leaves")
    public ResponseEntity<ApiResponse<LeaveResponse>> applyLeave(
            Authentication authentication,
            @org.springframework.web.bind.annotation.RequestBody @jakarta.validation.Valid LeaveRequest request) {
        AppUser user = currentUser(authentication);
        if (user.getEmployeeId() == null) {
            throw new ResourceNotFoundException("No employee profile is linked to this account");
        }

        request.setEmployeeId(user.getEmployeeId());
        request.setStatus(LeaveStatus.PENDING);

        return ResponseEntity.status(org.springframework.http.HttpStatus.CREATED)
                .body(ApiResponse.success("Leave request submitted successfully", leaveService.applyLeave(request)));
    }

    @GetMapping("/leaves")
    public ResponseEntity<ApiResponse<List<LeaveResponse>>> leaves(Authentication authentication) {
        AppUser user = currentUser(authentication);
        if (user.getEmployeeId() == null) {
            return ResponseEntity.ok(ApiResponse.success("No employee leave records are linked to this account", List.of()));
        }
        return ResponseEntity.ok(ApiResponse.success("Leave records retrieved successfully", leaveService.getLeaveByEmployeeId(user.getEmployeeId())));
    }

    private AppUser currentUser(Authentication authentication) {
        return userRepository.findByUsername(authentication.getName())
                .orElseThrow(() -> new ResourceNotFoundException("Authenticated user not found"));
    }
}
