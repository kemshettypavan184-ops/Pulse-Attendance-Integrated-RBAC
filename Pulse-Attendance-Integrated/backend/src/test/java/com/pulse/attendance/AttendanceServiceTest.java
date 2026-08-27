package com.pulse.attendance;

import com.pulse.attendance.dto.AttendanceRequest;
import com.pulse.attendance.dto.AttendanceResponse;
import com.pulse.attendance.entity.Attendance;
import com.pulse.attendance.entity.Employee;
import com.pulse.attendance.enums.AttendanceStatus;
import com.pulse.attendance.enums.EmployeeStatus;
import com.pulse.attendance.exception.ResourceNotFoundException;
import com.pulse.attendance.exception.DuplicateResourceException;
import com.pulse.attendance.repository.AttendanceRepository;
import com.pulse.attendance.repository.EmployeeRepository;
import com.pulse.attendance.service.AttendanceService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.modelmapper.ModelMapper;

import java.time.LocalDate;
import java.time.LocalTime;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
public class AttendanceServiceTest {

    @Mock
    private AttendanceRepository attendanceRepository;

    @Mock
    private EmployeeRepository employeeRepository;

    @Mock
    private ModelMapper modelMapper;

    @InjectMocks
    private AttendanceService attendanceService;

    private AttendanceRequest attendanceRequest;
    private Attendance attendance;
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

        attendanceRequest = new AttendanceRequest(
                1L,
                LocalDate.now(),
                LocalTime.of(9, 0),
                LocalTime.of(17, 30),
                AttendanceStatus.PRESENT,
                "Regular day");

        attendance = new Attendance(
                1L,
                employee,
                LocalDate.now(),
                LocalTime.of(9, 0),
                LocalTime.of(17, 30),
                AttendanceStatus.PRESENT,
                "Regular day",
                LocalDate.now(),
                LocalDate.now());
    }

    @Test
    @SuppressWarnings("null")
    public void testMarkAttendance_Success() {
        when(employeeRepository.findById(1L)).thenReturn(Optional.of(employee));
        when(attendanceRepository.existsByEmployeeIdAndAttendanceDate(
                1L, attendanceRequest.getAttendanceDate())).thenReturn(false);
        when(modelMapper.map(attendanceRequest, Attendance.class)).thenReturn(attendance);
        when(attendanceRepository.save(any(Attendance.class))).thenReturn(attendance);

        AttendanceResponse mockResponse = new AttendanceResponse(
                1L, 1L, "John Doe", LocalDate.now(),
                LocalTime.of(9, 0), LocalTime.of(17, 30),
                AttendanceStatus.PRESENT, "Regular day",
                LocalDate.now(), LocalDate.now());
        when(modelMapper.map(attendance, AttendanceResponse.class)).thenReturn(mockResponse);

        AttendanceResponse result = attendanceService.markAttendance(attendanceRequest);

        assertNotNull(result);
        assertEquals(1L, result.getEmployeeId());
        assertEquals("John Doe", result.getEmployeeName());
        verify(attendanceRepository, times(1)).save(any(Attendance.class));
    }

    @Test
    @SuppressWarnings("null")
    public void testMarkAttendance_EmployeeNotFound() {
        when(employeeRepository.findById(1L)).thenReturn(Optional.empty());

        assertThrows(ResourceNotFoundException.class, () -> attendanceService.markAttendance(attendanceRequest));
        verify(attendanceRepository, never()).save(any(Attendance.class));
    }

    @Test
    public void testMarkAttendance_DuplicateAttendance() {
        when(employeeRepository.findById(1L)).thenReturn(Optional.of(employee));
        when(attendanceRepository.existsByEmployeeIdAndAttendanceDate(
                1L, attendanceRequest.getAttendanceDate())).thenReturn(true);

        DuplicateResourceException exception = assertThrows(
                DuplicateResourceException.class,
                () -> attendanceService.markAttendance(attendanceRequest));

        assertTrue(exception.getMessage().contains("Attendance is already marked"));
        verify(modelMapper, never()).map(attendanceRequest, Attendance.class);
        verify(attendanceRepository, never()).save(any(Attendance.class));
    }

    @Test
    public void testGetAttendanceById_Success() {
        when(attendanceRepository.findById(1L)).thenReturn(Optional.of(attendance));

        AttendanceResponse mockResponse = new AttendanceResponse(
                1L, 1L, "John Doe", LocalDate.now(),
                LocalTime.of(9, 0), LocalTime.of(17, 30),
                AttendanceStatus.PRESENT, "Regular day",
                LocalDate.now(), LocalDate.now());
        when(modelMapper.map(attendance, AttendanceResponse.class)).thenReturn(mockResponse);

        AttendanceResponse result = attendanceService.getAttendanceById(1L);

        assertNotNull(result);
        assertEquals("John Doe", result.getEmployeeName());
    }

    @Test
    public void testGetAttendanceById_NotFound() {
        when(attendanceRepository.findById(1L)).thenReturn(Optional.empty());

        assertThrows(ResourceNotFoundException.class, () -> attendanceService.getAttendanceById(1L));
    }
}
