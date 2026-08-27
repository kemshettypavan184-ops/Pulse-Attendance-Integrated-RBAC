package com.pulse.attendance.service;

import com.pulse.attendance.dto.AttendanceRequest;
import com.pulse.attendance.dto.AttendanceResponse;
import com.pulse.attendance.entity.Attendance;
import com.pulse.attendance.entity.Employee;
import com.pulse.attendance.enums.AttendanceStatus;
import com.pulse.attendance.exception.ResourceNotFoundException;
import com.pulse.attendance.exception.DuplicateResourceException;
import com.pulse.attendance.repository.AttendanceRepository;
import com.pulse.attendance.repository.EmployeeRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.modelmapper.ModelMapper;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
@Transactional
public class AttendanceService {

    private final AttendanceRepository attendanceRepository;
    private final EmployeeRepository employeeRepository;
    private final ModelMapper modelMapper;

    // CREATE / MARK ATTENDANCE
    @SuppressWarnings("null")
    public AttendanceResponse markAttendance(AttendanceRequest request) {
        log.info("Marking attendance for employeeId={}", request.getEmployeeId());


        Employee employee = employeeRepository.findById(request.getEmployeeId())
                .orElseThrow(() -> new ResourceNotFoundException(
                        "Employee not found with id: " + request.getEmployeeId()));

        // Debug checkpoint: inspect employeeId/date here when tracing duplicate-attendance issues.
        if (attendanceRepository.existsByEmployeeIdAndAttendanceDate(
                request.getEmployeeId(), request.getAttendanceDate())) {
            log.warn("Duplicate attendance detected for employeeId={} attendanceDate={}",
                    request.getEmployeeId(), request.getAttendanceDate());
            throw new DuplicateResourceException(
                    "Attendance is already marked for employee " + request.getEmployeeId()
                            + " on " + request.getAttendanceDate());
        }

        Attendance attendance = modelMapper.map(request, Attendance.class);

        attendance.setEmployee(employee);

        Attendance savedAttendance = attendanceRepository.save(attendance);

        return mapToResponse(savedAttendance);
    }

    @SuppressWarnings("null")
    public AttendanceResponse checkIn(Long employeeId) {
        LocalDate today = LocalDate.now();
        if (attendanceRepository.findByEmployeeIdAndAttendanceDate(employeeId, today).isPresent()) {
            throw new DuplicateResourceException("Attendance is already marked for today");
        }

        Employee employee = employeeRepository.findById(employeeId)
                .orElseThrow(() -> new ResourceNotFoundException("Employee not found with id: " + employeeId));

        Attendance attendance = new Attendance();
        attendance.setEmployee(employee);
        attendance.setAttendanceDate(today);
        attendance.setCheckInTime(java.time.LocalTime.now());
        attendance.setStatus(AttendanceStatus.PRESENT);
        attendance.setRemarks("Employee self check-in");

        return mapToResponse(attendanceRepository.save(attendance));
    }

    @SuppressWarnings("null")
    public AttendanceResponse checkOut(Long employeeId) {
        Attendance attendance = attendanceRepository.findByEmployeeIdAndAttendanceDate(employeeId, LocalDate.now())
                .orElseThrow(() -> new ResourceNotFoundException("No attendance record found for today"));

        if (attendance.getCheckOutTime() != null) {
            throw new DuplicateResourceException("Attendance is already checked out for today");
        }

        attendance.setCheckOutTime(java.time.LocalTime.now());
        attendance.setUpdatedAt(LocalDate.now());
        return mapToResponse(attendanceRepository.save(attendance));
    }

    @SuppressWarnings("null")
    @Transactional(readOnly = true)
    public AttendanceResponse getAttendanceById(Long id) {

        Attendance attendance = attendanceRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException(
                        "Attendance not found with id: " + id));

        return mapToResponse(attendance);
    }

    // GET ATTENDANCE BY EMPLOYEE AND DATE RANGE
    @Transactional(readOnly = true)
    public List<AttendanceResponse> getAttendanceByEmployeeAndDateRange(
            Long employeeId,
            LocalDate startDate,
            LocalDate endDate) {

        return attendanceRepository
                .findByEmployeeIdAndAttendanceDateBetween(
                        employeeId,
                        startDate,
                        endDate)
                .stream()
                .map(this::mapToResponse)
                .collect(Collectors.toList());
    }

    // GET PRESENT EMPLOYEES BY DATE
    @Transactional(readOnly = true)
    public List<AttendanceResponse> getAttendanceByDate(
            LocalDate date) {

        // Debug checkpoint: inspect date and repositoryResult while stepping through the API.
        return attendanceRepository
                .findByAttendanceDate(date)
                .stream()
                .map(this::mapToResponse)
                .collect(Collectors.toList());
    }

    // GET ALL ATTENDANCE
    @Transactional(readOnly = true)
    public List<AttendanceResponse> getAllAttendance() {

        return attendanceRepository.findAll()
                .stream()
                .map(this::mapToResponse)
                .collect(Collectors.toList());
    }

    // UPDATE ATTENDANCE
    @SuppressWarnings("null")
    public AttendanceResponse updateAttendance(
            Long id,
            AttendanceRequest request) {

        Attendance attendance = attendanceRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException(
                        "Attendance not found with id: " + id));

        Employee employee = employeeRepository.findById(
                request.getEmployeeId()).orElseThrow(
                        () -> new ResourceNotFoundException(
                                "Employee not found with id: "
                                        + request.getEmployeeId()));

        modelMapper.map(request, attendance);

        attendance.setEmployee(employee);

        Attendance updatedAttendance = attendanceRepository.save(attendance);

        return mapToResponse(updatedAttendance);
    }

    // DELETE ATTENDANCE
    @SuppressWarnings("null")
    public void deleteAttendance(Long id) {

        Attendance attendance = attendanceRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException(
                        "Attendance not found with id: " + id));

        attendanceRepository.delete(attendance);
    }

    // MAP ENTITY TO RESPONSE
    private AttendanceResponse mapToResponse(
            Attendance attendance) {

        AttendanceResponse response = modelMapper.map(
                attendance,
                AttendanceResponse.class);

        if (attendance.getEmployee() != null) {
            response.setEmployeeName(
                    attendance.getEmployee().getFullName());
        }

        return response;
    }
}