package com.pulse.attendance.service;

import com.pulse.attendance.dto.EmployeeRequest;
import com.pulse.attendance.dto.EmployeeResponse;
import com.pulse.attendance.entity.Employee;
import com.pulse.attendance.exception.DuplicateResourceException;
import com.pulse.attendance.exception.ResourceNotFoundException;
import com.pulse.attendance.repository.EmployeeRepository;
import com.pulse.attendance.enums.EmployeeStatus;
import com.pulse.attendance.dto.PageResponse;
import com.pulse.attendance.specification.EmployeeSpecification;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.domain.Specification;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
@Transactional
public class EmployeeService {

    private final EmployeeRepository employeeRepository;

    // =========================
    // CREATE
    // =========================
    public EmployeeResponse createEmployee(EmployeeRequest request) {
        log.info("Creating employee with employeeId={}", request.getEmployeeId());

        // Check duplicate email
        if (employeeRepository.findByEmail(request.getEmail()).isPresent()) {
            throw new DuplicateResourceException(
                    "Employee with email " + request.getEmail() + " already exists");
        }

        // Check duplicate employee ID
        if (employeeRepository.findByEmployeeId(request.getEmployeeId()).isPresent()) {
            throw new DuplicateResourceException(
                    "Employee with employee ID " + request.getEmployeeId() + " already exists");
        }

        Employee employee = new Employee();

        employee.setEmployeeId(request.getEmployeeId());
        employee.setFullName(request.getFullName());
        employee.setEmail(request.getEmail());
        employee.setPhoneNumber(request.getPhoneNumber());
        employee.setDateOfBirth(request.getDateOfBirth());
        employee.setJoinDate(request.getJoinDate());
        employee.setDepartment(request.getDepartment());
        employee.setDesignation(request.getDesignation());
        employee.setStatus(request.getStatus());
        employee.setReportingManager(request.getReportingManager());
        employee.setManagerId(request.getManagerId());
        employee.setSalary(request.getSalary());

        Employee savedEmployee = employeeRepository.save(employee);

        return mapToResponse(savedEmployee);
    }

    // =========================
    // READ - GET BY ID
    // =========================
    @Transactional(readOnly = true)
    public EmployeeResponse getEmployeeById(Long id) {

        Employee employee = employeeRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException(
                        "Employee not found with id: " + id));

        return mapToResponse(employee);
    }

    // =========================
    // READ - GET BY EMPLOYEE ID
    // =========================
    @Transactional(readOnly = true)
    public EmployeeResponse getEmployeeByEmployeeId(String employeeId) {

        Employee employee = employeeRepository.findByEmployeeId(employeeId)
                .orElseThrow(() -> new ResourceNotFoundException(
                        "Employee not found with employeeId: " + employeeId));

        return mapToResponse(employee);
    }

    // =========================
    // READ - GET ALL
    // =========================
    @Transactional(readOnly = true)
    public List<EmployeeResponse> getAllEmployees() {

        return employeeRepository.findAll()
                .stream()
                .map(this::mapToResponse)
                .collect(Collectors.toList());
    }

    // =========================
    // READ - GET BY DEPARTMENT
    // =========================
    @Transactional(readOnly = true)
    public List<EmployeeResponse> getEmployeesByDepartment(
            String department) {

        return employeeRepository.findByDepartment(department)
                .stream()
                .map(this::mapToResponse)
                .collect(Collectors.toList());
    }

    // =========================
    // ADVANCED SEARCH
    // =========================
    @Transactional(readOnly = true)
    public PageResponse<EmployeeResponse> searchEmployees(
            String name,
            String employeeId,
            String email,
            String department,
            String designation,
            EmployeeStatus status,
            Pageable pageable) {

        log.info("Advanced employee search: name={}, employeeId={}, email={}, department={}, designation={}, status={}, page={}, size={}, sort={}",
                name, employeeId, email, department, designation, status,
                pageable.getPageNumber(), pageable.getPageSize(), pageable.getSort());

        Specification<Employee> specification = Specification.where(null);

        if (name != null && !name.isBlank()) {
            specification = specification.and(EmployeeSpecification.fullNameContains(name.trim()));
        }
        if (employeeId != null && !employeeId.isBlank()) {
            specification = specification.and(EmployeeSpecification.employeeIdContains(employeeId.trim()));
        }
        if (email != null && !email.isBlank()) {
            specification = specification.and(EmployeeSpecification.emailContains(email.trim()));
        }
        if (department != null && !department.isBlank()) {
            specification = specification.and(EmployeeSpecification.departmentContains(department.trim()));
        }
        if (designation != null && !designation.isBlank()) {
            specification = specification.and(EmployeeSpecification.designationContains(designation.trim()));
        }
        if (status != null) {
            specification = specification.and(EmployeeSpecification.statusEquals(status));
        }

        Page<Employee> page = employeeRepository.findAll(specification, pageable);
        List<EmployeeResponse> content = page.getContent().stream()
                .map(this::mapToResponse)
                .collect(Collectors.toList());

        return new PageResponse<>(
                content,
                page.getNumber(),
                page.getSize(),
                page.getTotalElements(),
                page.getTotalPages(),
                page.isFirst(),
                page.isLast());
    }

    // =========================
    // UPDATE
    // =========================
    public EmployeeResponse updateEmployee(
            Long id,
            EmployeeRequest request) {

        Employee employee = employeeRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException(
                        "Employee not found with id: " + id));

        // Check duplicate email
        employeeRepository.findByEmail(request.getEmail())
                .ifPresent(existingEmployee -> {
                    if (!existingEmployee.getId().equals(id)) {
                        throw new DuplicateResourceException(
                                "Employee with email "
                                        + request.getEmail()
                                        + " already exists");
                    }
                });

        // Check duplicate employee ID
        employeeRepository.findByEmployeeId(request.getEmployeeId())
                .ifPresent(existingEmployee -> {
                    if (!existingEmployee.getId().equals(id)) {
                        throw new DuplicateResourceException(
                                "Employee with employee ID "
                                        + request.getEmployeeId()
                                        + " already exists");
                    }
                });

        // Manually update fields
        employee.setEmployeeId(request.getEmployeeId());
        employee.setFullName(request.getFullName());
        employee.setEmail(request.getEmail());
        employee.setPhoneNumber(request.getPhoneNumber());
        employee.setDateOfBirth(request.getDateOfBirth());
        employee.setJoinDate(request.getJoinDate());
        employee.setDepartment(request.getDepartment());
        employee.setDesignation(request.getDesignation());
        employee.setStatus(request.getStatus());
        employee.setReportingManager(request.getReportingManager());
        employee.setManagerId(request.getManagerId());
        employee.setSalary(request.getSalary());

        Employee updatedEmployee = employeeRepository.save(employee);

        return mapToResponse(updatedEmployee);
    }

    // =========================
    // DELETE
    // =========================
    public void deleteEmployee(Long id) {
        log.info("Deleting employee with id={}", id);

        Employee employee = employeeRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException(
                        "Employee not found with id: " + id));

        employeeRepository.delete(employee);
    }

    // =========================
    // ENTITY → RESPONSE
    // =========================
    private EmployeeResponse mapToResponse(Employee employee) {

        EmployeeResponse response = new EmployeeResponse();

        response.setId(employee.getId());
        response.setEmployeeId(employee.getEmployeeId());
        response.setFullName(employee.getFullName());
        response.setEmail(employee.getEmail());
        response.setPhoneNumber(employee.getPhoneNumber());
        response.setDateOfBirth(employee.getDateOfBirth());
        response.setJoinDate(employee.getJoinDate());
        response.setDepartment(employee.getDepartment());
        response.setDesignation(employee.getDesignation());
        response.setStatus(employee.getStatus());
        response.setReportingManager(employee.getReportingManager());
        response.setSalary(employee.getSalary());
        response.setCreatedAt(employee.getCreatedAt());
        response.setUpdatedAt(employee.getUpdatedAt());

        return response;
    }
}