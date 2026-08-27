package com.pulse.attendance.service;

import com.pulse.attendance.dto.PayrollResponse;
import com.pulse.attendance.entity.PayrollRecord;
import com.pulse.attendance.entity.Employee;
import com.pulse.attendance.exception.ResourceNotFoundException;
import com.pulse.attendance.repository.PayrollRepository;
import com.pulse.attendance.repository.EmployeeRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.modelmapper.ModelMapper;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.YearMonth;
import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
@Transactional
public class PayrollService {

    private final PayrollRepository payrollRepository;
    private final EmployeeRepository employeeRepository;
    private final ModelMapper modelMapper;

    @SuppressWarnings("null")
    public PayrollResponse generatePayroll(Long employeeId, YearMonth month, Integer actualWorkingDays) {
        log.info("Generating payroll for employeeId={}, month={}", employeeId, month);

        Employee employee = employeeRepository.findById(employeeId)
                .orElseThrow(() -> new ResourceNotFoundException("Employee not found with id: " + employeeId));

        PayrollRecord payroll = new PayrollRecord();
        payroll.setEmployee(employee);
        payroll.setMonth(month);
        payroll.setBaseSalary(employee.getSalary());
        payroll.setTotalWorkingDays(22); // Standard working days per month
        payroll.setActualWorkingDays(actualWorkingDays);
        payroll.setLeaveDays(22 - actualWorkingDays);

        // Calculate gross and net salary
        Double grossSalary = employee.getSalary();
        Double deductions = grossSalary * 0.1; // 10% deductions
        Double netSalary = grossSalary - deductions;

        payroll.setGrossSalary(grossSalary);
        payroll.setDeductions(deductions);
        payroll.setNetSalary(netSalary);

        PayrollRecord savedPayroll = payrollRepository.save(payroll);
        return mapToResponse(savedPayroll);
    }

    @SuppressWarnings("null")
    @Transactional(readOnly = true)
    public PayrollResponse getPayrollById(Long id) {
        PayrollRecord payroll = payrollRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Payroll not found with id: " + id));
        return mapToResponse(payroll);
    }

    @Transactional(readOnly = true)
    public PayrollResponse getPayrollByEmployeeAndMonth(Long employeeId, YearMonth month) {
        PayrollRecord payroll = payrollRepository.findByEmployeeIdAndMonth(employeeId, month)
                .orElseThrow(() -> new ResourceNotFoundException(
                        "Payroll not found for employee id: " + employeeId + " and month: " + month));
        return mapToResponse(payroll);
    }

    @Transactional(readOnly = true)
    public List<PayrollResponse> getPayrollByEmployeeId(Long employeeId) {
        return payrollRepository.findByEmployeeId(employeeId).stream()
                .map(this::mapToResponse)
                .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public List<PayrollResponse> getPayrollByMonth(YearMonth month) {
        return payrollRepository.findByMonth(month).stream()
                .map(this::mapToResponse)
                .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public List<PayrollResponse> getAllPayroll() {
        return payrollRepository.findAll().stream()
                .map(this::mapToResponse)
                .collect(Collectors.toList());
    }

    @SuppressWarnings("null")
    public void deletePayroll(Long id) {
        PayrollRecord payroll = payrollRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Payroll not found with id: " + id));
        payrollRepository.delete(payroll);
    }

    private PayrollResponse mapToResponse(PayrollRecord payroll) {
        PayrollResponse response = modelMapper.map(payroll, PayrollResponse.class);
        response.setEmployeeName(payroll.getEmployee().getFullName());
        return response;
    }
}
