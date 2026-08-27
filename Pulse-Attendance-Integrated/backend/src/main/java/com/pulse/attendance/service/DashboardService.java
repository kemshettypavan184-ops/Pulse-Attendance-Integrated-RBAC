package com.pulse.attendance.service;

import com.pulse.attendance.dto.DashboardStatsResponse;
import com.pulse.attendance.entity.AppUser;
import com.pulse.attendance.entity.Employee;
import com.pulse.attendance.enums.AttendanceStatus;
import com.pulse.attendance.enums.LeaveStatus;
import com.pulse.attendance.repository.AppUserRepository;
import com.pulse.attendance.repository.AttendanceRepository;
import com.pulse.attendance.repository.EmployeeRepository;
import com.pulse.attendance.repository.LeaveRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.util.List;
import java.util.Set;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class DashboardService {
    private final EmployeeRepository employeeRepository;
    private final AttendanceRepository attendanceRepository;
    private final LeaveRepository leaveRepository;
    private final AppUserRepository userRepository;

    public DashboardStatsResponse getStats(String username) {
        AppUser user = userRepository.findByUsername(username).orElseThrow();
        LocalDate today = LocalDate.now();

        List<Employee> employees;
        if (user.getRole() == com.pulse.attendance.enums.Role.ADMIN) {
            employees = employeeRepository.findAll();
        } else if (user.getRole() == com.pulse.attendance.enums.Role.MANAGER) {
            String managerName = user.getFullName();
            employees = employeeRepository.findAll().stream()
                    .filter(e -> managerName.equalsIgnoreCase(e.getReportingManager()) || user.getUsername().equalsIgnoreCase(e.getReportingManager()))
                    .toList();
        } else if (user.getEmployeeId() != null) {
            employees = employeeRepository.findById(user.getEmployeeId()).map(List::of).orElse(List.of());
        } else {
            employees = List.of();
        }

        Set<Long> employeeIds = employees.stream().map(Employee::getId).collect(Collectors.toSet());
        var attendance = attendanceRepository.findAll().stream()
                .filter(a -> today.equals(a.getAttendanceDate()) && employeeIds.contains(a.getEmployee().getId()))
                .toList();

        long present = attendance.stream().filter(a -> a.getStatus() == AttendanceStatus.PRESENT || a.getStatus() == AttendanceStatus.WORK_FROM_HOME).count();
        long late = attendance.stream().filter(a -> a.getStatus() == AttendanceStatus.LATE).count();
        long absent = attendance.stream().filter(a -> a.getStatus() == AttendanceStatus.ABSENT).count();
        long onLeave = leaveRepository.findByStatus(LeaveStatus.APPROVED).stream()
                .filter(l -> employeeIds.contains(l.getEmployee().getId()))
                .filter(l -> !today.isBefore(l.getStartDate()) && !today.isAfter(l.getEndDate()))
                .count();
        long pendingLeaves = leaveRepository.findByStatus(LeaveStatus.PENDING).stream()
                .filter(l -> employeeIds.contains(l.getEmployee().getId()))
                .count();

        return new DashboardStatsResponse(employees.size(), present, late, absent, onLeave, pendingLeaves);
    }
}
