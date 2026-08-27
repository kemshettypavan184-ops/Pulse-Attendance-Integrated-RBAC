package com.pulse.attendance;

import com.pulse.attendance.dto.EmployeeRequest;
import com.pulse.attendance.dto.EmployeeResponse;
import com.pulse.attendance.entity.Employee;
import com.pulse.attendance.enums.EmployeeStatus;
import com.pulse.attendance.exception.DuplicateResourceException;
import com.pulse.attendance.exception.ResourceNotFoundException;
import com.pulse.attendance.repository.EmployeeRepository;
import com.pulse.attendance.service.EmployeeService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.modelmapper.ModelMapper;

import java.time.LocalDate;
import java.util.Optional;
import java.util.List;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import com.pulse.attendance.dto.PageResponse;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
public class EmployeeServiceTest {

    @Mock
    private EmployeeRepository employeeRepository;

    @Mock
    private ModelMapper modelMapper;

    @InjectMocks
    private EmployeeService employeeService;

    private EmployeeRequest employeeRequest;
    private Employee employee;
    private EmployeeResponse employeeResponse;

    @BeforeEach
    public void setUp() {

        // Employee Request
        employeeRequest = new EmployeeRequest(
                "EMP001",
                "John Doe",
                "john@example.com",
                "1234567890",
                LocalDate.of(1990, 5, 15),
                LocalDate.of(2020, 1, 1),
                "Engineering",
                "Software Engineer",
                EmployeeStatus.ACTIVE,
                "Jane Manager",
                100L,
                50000.0);

        // Employee Entity
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
        employee.setManagerId(100L);
        employee.setSalary(50000.0);
        employee.setCreatedAt(LocalDate.now());
        employee.setUpdatedAt(LocalDate.now());

        // Employee Response
        employeeResponse = new EmployeeResponse(
                1L,
                "EMP001",
                "John Doe",
                "john@example.com",
                "1234567890",
                LocalDate.of(1990, 5, 15),
                LocalDate.of(2020, 1, 1),
                "Engineering",
                "Software Engineer",
                EmployeeStatus.ACTIVE,
                "Jane Manager",
                50000.0,
                LocalDate.now(),
                LocalDate.now());
    }

    // CREATE - Success
    @Test
    @SuppressWarnings("null")
    public void testCreateEmployee_Success() {

        when(employeeRepository.findByEmail(employeeRequest.getEmail()))
                .thenReturn(Optional.empty());

        when(modelMapper.map(employeeRequest, Employee.class))
                .thenReturn(employee);

        when(employeeRepository.save(any(Employee.class)))
                .thenReturn(employee);

        when(modelMapper.map(employee, EmployeeResponse.class))
                .thenReturn(employeeResponse);

        EmployeeResponse result = employeeService.createEmployee(employeeRequest);

        assertNotNull(result);
        assertEquals("EMP001", result.getEmployeeId());
        assertEquals("John Doe", result.getFullName());

        verify(employeeRepository, times(1))
                .save(any(Employee.class));
    }

    // CREATE - Duplicate Email
    @Test
    @SuppressWarnings("null")
    public void testCreateEmployee_DuplicateEmail() {

        when(employeeRepository.findByEmail(employeeRequest.getEmail()))
                .thenReturn(Optional.of(employee));

        assertThrows(
                DuplicateResourceException.class,
                () -> employeeService.createEmployee(employeeRequest));

        verify(employeeRepository, never())
                .save(any(Employee.class));
    }

    // READ - Success
    @Test
    public void testGetEmployeeById_Success() {

        when(employeeRepository.findById(1L))
                .thenReturn(Optional.of(employee));

        when(modelMapper.map(employee, EmployeeResponse.class))
                .thenReturn(employeeResponse);

        EmployeeResponse result = employeeService.getEmployeeById(1L);

        assertNotNull(result);
        assertEquals(1L, result.getId());
        assertEquals("John Doe", result.getFullName());
    }

    // READ - Not Found
    @Test
    public void testGetEmployeeById_NotFound() {

        when(employeeRepository.findById(1L))
                .thenReturn(Optional.empty());

        assertThrows(
                ResourceNotFoundException.class,
                () -> employeeService.getEmployeeById(1L));
    }
    @Test
    public void testSearchEmployees_WithMultipleFilters() {
        Page<Employee> page = new PageImpl<>(List.of(employee));
        when(employeeRepository.findAll(any(org.springframework.data.jpa.domain.Specification.class), any(PageRequest.class)))
                .thenReturn(page);

        PageResponse<EmployeeResponse> result = employeeService.searchEmployees(
                "John", null, null, "Engineering", "Software", EmployeeStatus.ACTIVE,
                PageRequest.of(0, 10, Sort.by("fullName")));

        assertNotNull(result);
        assertEquals(1, result.getContent().size());
        assertEquals(1, result.getTotalElements());
        verify(employeeRepository, times(1))
                .findAll(any(org.springframework.data.jpa.domain.Specification.class), any(PageRequest.class));
    }

    @Test
    public void testSearchEmployees_EmptyResult() {
        Page<Employee> page = new PageImpl<>(List.of());
        when(employeeRepository.findAll(any(org.springframework.data.jpa.domain.Specification.class), any(PageRequest.class)))
                .thenReturn(page);

        PageResponse<EmployeeResponse> result = employeeService.searchEmployees(
                null, null, null, "Unknown", null, null,
                PageRequest.of(0, 10));

        assertNotNull(result);
        assertTrue(result.getContent().isEmpty());
        assertEquals(0, result.getTotalElements());
    }

}
