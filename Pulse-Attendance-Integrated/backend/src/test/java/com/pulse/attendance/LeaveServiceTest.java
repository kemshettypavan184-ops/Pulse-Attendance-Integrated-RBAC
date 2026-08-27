package com.pulse.attendance;

import com.pulse.attendance.dto.LeaveRequest;
import com.pulse.attendance.dto.LeaveResponse;
import com.pulse.attendance.entity.Leave;
import com.pulse.attendance.entity.Employee;
import com.pulse.attendance.enums.LeaveStatus;
import com.pulse.attendance.enums.LeaveType;
import com.pulse.attendance.enums.EmployeeStatus;
import com.pulse.attendance.exception.ResourceNotFoundException;
import com.pulse.attendance.repository.LeaveRepository;
import com.pulse.attendance.repository.EmployeeRepository;
import com.pulse.attendance.service.LeaveService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.modelmapper.ModelMapper;

import java.time.LocalDate;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
public class LeaveServiceTest {

    @Mock
    private LeaveRepository leaveRepository;

    @Mock
    private EmployeeRepository employeeRepository;

    @Mock
    private ModelMapper modelMapper;

    @InjectMocks
    private LeaveService leaveService;

    private LeaveRequest leaveRequest;
    private Leave leave;
    private Employee employee;

    @BeforeEach
    public void setUp() {
        employee = new Employee();
        employee.setId(1L);
        employee.setEmployeeId("EMP001");
        employee.setFullName("John Doe");
        employee.setEmail("john@example.com");
        employee.setPhoneNumber("1234567890");
        employee.setDateOfBirth(LocalDate.of(1990, 5, 15));
        employee.setJoinDate(LocalDate.of(2020, 1, 1));
        employee.setDepartment("Engineering");
        employee.setDesignation("Software Engineer");
        employee.setStatus(EmployeeStatus.ACTIVE);
        employee.setReportingManager("Jane Manager");
        employee.setSalary(50000.0);
        employee.setCreatedAt(LocalDate.now());
        employee.setUpdatedAt(LocalDate.now());

        leaveRequest = new LeaveRequest(
                1L,
                LeaveType.CASUAL_LEAVE,
                LocalDate.now().plusDays(1),
                LocalDate.now().plusDays(5),
                5,
                "Personal reasons",
                LeaveStatus.PENDING,
                "Waiting for approval");

        leave = new Leave(
                1L,
                employee,
                LeaveType.CASUAL_LEAVE,
                LocalDate.now().plusDays(1),
                LocalDate.now().plusDays(5),
                5,
                "Personal reasons",
                LeaveStatus.PENDING,
                "Waiting for approval",
                null,
                LocalDate.now(),
                LocalDate.now());
    }

    @Test
    @SuppressWarnings("null")
    public void testApplyLeave_Success() {
        when(employeeRepository.findById(1L)).thenReturn(Optional.of(employee));
        when(modelMapper.map(leaveRequest, Leave.class)).thenReturn(leave);
        when(leaveRepository.save(any(Leave.class))).thenReturn(leave);

        LeaveResponse result = leaveService.applyLeave(leaveRequest);

        assertNotNull(result);
        assertEquals(1L, result.getEmployeeId());
        assertEquals("John Doe", result.getEmployeeName());
        verify(leaveRepository, times(1)).save(any(Leave.class));
    }

    @Test
    @SuppressWarnings("null")
    public void testApplyLeave_EmployeeNotFound() {
        when(employeeRepository.findById(1L)).thenReturn(Optional.empty());

        assertThrows(ResourceNotFoundException.class, () -> leaveService.applyLeave(leaveRequest));
        verify(leaveRepository, never()).save(any(Leave.class));
    }

    @Test
    public void testGetLeaveById_Success() {
        when(leaveRepository.findById(1L)).thenReturn(Optional.of(leave));

        LeaveResponse result = leaveService.getLeaveById(1L);

        assertNotNull(result);
        assertEquals(1L, result.getEmployeeId());
        assertEquals("John Doe", result.getEmployeeName());
    }

    @Test
    public void testGetLeaveById_NotFound() {
        when(leaveRepository.findById(1L)).thenReturn(Optional.empty());

        assertThrows(ResourceNotFoundException.class, () -> leaveService.getLeaveById(1L));
    }
}
