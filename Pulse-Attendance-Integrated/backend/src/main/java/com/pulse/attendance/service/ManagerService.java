package com.pulse.attendance.service;

import com.pulse.attendance.dto.AttendanceResponse;
import com.pulse.attendance.dto.LeaveResponse;
import com.pulse.attendance.entity.Employee;
import com.pulse.attendance.entity.Leave;
import com.pulse.attendance.enums.LeaveStatus;
import com.pulse.attendance.exception.ResourceNotFoundException;
import com.pulse.attendance.repository.AttendanceRepository;
import com.pulse.attendance.repository.EmployeeRepository;
import com.pulse.attendance.repository.LeaveRepository;
import lombok.RequiredArgsConstructor;
import org.modelmapper.ModelMapper;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Transactional
public class ManagerService {

    private final EmployeeRepository employeeRepository;
    private final AttendanceRepository attendanceRepository;
    private final LeaveRepository leaveRepository;
    private final ModelMapper modelMapper;

    // GET TEAM ATTENDANCE
    @Transactional(readOnly = true)
    public List<AttendanceResponse> getTeamAttendance(
            String managerName,
            LocalDate startDate,
            LocalDate endDate) {

        List<Employee> teamMembers = employeeRepository.findAll()
                .stream()
                .filter(emp -> managerName.equals(emp.getReportingManager()))
                .collect(Collectors.toList());

        return teamMembers.stream()
                .flatMap(emp -> attendanceRepository
                        .findByEmployeeIdAndAttendanceDateBetween(
                                emp.getId(),
                                startDate,
                                endDate)
                        .stream())
                .map(attendance -> {

                    AttendanceResponse response = modelMapper.map(
                            attendance,
                            AttendanceResponse.class);

                    if (attendance.getEmployee() != null) {
                        response.setEmployeeName(
                                attendance.getEmployee().getFullName());
                    }

                    return response;
                })
                .collect(Collectors.toList());
    }

    // GET TEAM LEAVE REQUESTS
    @Transactional(readOnly = true)
    public List<LeaveResponse> getTeamLeaveRequests(
            String managerName) {

        List<Employee> teamMembers = employeeRepository.findAll()
                .stream()
                .filter(emp -> managerName.equals(emp.getReportingManager()))
                .collect(Collectors.toList());

        return teamMembers.stream()
                .flatMap(emp -> leaveRepository
                        .findByEmployeeAndStatus(
                                emp,
                                LeaveStatus.PENDING)
                        .stream())
                .map(leave -> {

                    LeaveResponse response = modelMapper.map(
                            leave,
                            LeaveResponse.class);

                    if (leave.getEmployee() != null) {
                        response.setEmployeeName(
                                leave.getEmployee().getFullName());
                    }

                    return response;
                })
                .collect(Collectors.toList());
    }

    // APPROVE LEAVE
    @SuppressWarnings("null")
    public void approveLeave(
            Long leaveId,
            String managerName) {

        Leave leave = leaveRepository.findById(leaveId)
                .orElseThrow(() -> new ResourceNotFoundException(
                        "Leave not found with id: " + leaveId));

        leave.setStatus(LeaveStatus.APPROVED);
        leave.setApprovedBy(managerName);

        leaveRepository.save(leave);
    }

    // REJECT LEAVE
    @SuppressWarnings("null")
    public void rejectLeave(Long leaveId) {

        Leave leave = leaveRepository.findById(leaveId)
                .orElseThrow(() -> new ResourceNotFoundException(
                        "Leave not found with id: " + leaveId));

        leave.setStatus(LeaveStatus.REJECTED);

        leaveRepository.save(leave);
    }
}