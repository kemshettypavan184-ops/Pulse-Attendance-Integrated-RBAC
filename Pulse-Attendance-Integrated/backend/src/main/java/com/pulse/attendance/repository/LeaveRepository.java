package com.pulse.attendance.repository;

import com.pulse.attendance.entity.Leave;
import com.pulse.attendance.entity.Employee;
import com.pulse.attendance.enums.LeaveStatus;
import com.pulse.attendance.enums.LeaveType;
import org.springframework.data.jpa.repository.JpaRepository;

import java.time.LocalDate;
import java.util.List;
import java.util.Collection;

public interface LeaveRepository extends JpaRepository<Leave, Long> {
    List<Leave> findByEmployeeIdAndStartDateBetween(Long employeeId, LocalDate startDate, LocalDate endDate);

    List<Leave> findByEmployeeAndStatus(Employee employee, LeaveStatus status);

    List<Leave> findByLeaveTypeAndStatus(LeaveType leaveType, LeaveStatus status);

    List<Leave> findByStatus(LeaveStatus status);

    List<Leave> findByEmployeeId(Long employeeId);

    List<Leave> findByEmployeeIdAndStatusInAndStartDateLessThanEqualAndEndDateGreaterThanEqual(
            Long employeeId,
            Collection<LeaveStatus> statuses,
            LocalDate endDate,
            LocalDate startDate);
}
