package com.pulse.attendance.service;

import com.pulse.attendance.dto.EmployeeResponse;
import com.pulse.attendance.dto.LeaveResponse;
import com.pulse.attendance.entity.Leave;
import com.pulse.attendance.enums.LeaveStatus;
import com.pulse.attendance.repository.EmployeeRepository;
import com.pulse.attendance.repository.LeaveRepository;
import lombok.RequiredArgsConstructor;
import org.modelmapper.ModelMapper;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Transactional
public class HrAdminService {

    private final EmployeeRepository employeeRepository;
    private final LeaveRepository leaveRepository;
    private final ModelMapper modelMapper;

    @Transactional(readOnly = true)
    public List<EmployeeResponse> getAllEmployees() {
        return employeeRepository.findAll().stream()
                .map(emp -> modelMapper.map(emp, EmployeeResponse.class))
                .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public List<LeaveResponse> getAllLeaveRequests() {
        return leaveRepository.findAll().stream()
                .map(leave -> {
                    LeaveResponse response = modelMapper.map(leave, LeaveResponse.class);
                    response.setEmployeeName(leave.getEmployee().getFullName());
                    return response;
                })
                .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public List<LeaveResponse> getPendingLeaveRequests() {
        return leaveRepository.findByStatus(LeaveStatus.PENDING).stream()
                .map(leave -> {
                    LeaveResponse response = modelMapper.map(leave, LeaveResponse.class);
                    response.setEmployeeName(leave.getEmployee().getFullName());
                    return response;
                })
                .collect(Collectors.toList());
    }

    public void approveAllPendingLeaves(String approvedBy) {
        List<Leave> pendingLeaves = leaveRepository.findByStatus(LeaveStatus.PENDING);
        pendingLeaves.forEach(leave -> {
            leave.setStatus(LeaveStatus.APPROVED);
            leave.setApprovedBy(approvedBy);
        });
        leaveRepository.saveAll(pendingLeaves);
    }

    @Transactional(readOnly = true)
    public Long getEmployeeCount() {
        return employeeRepository.count();
    }

    @Transactional(readOnly = true)
    public Long getPendingLeaveCount() {
        return leaveRepository.findByStatus(LeaveStatus.PENDING).stream().count();
    }
}
