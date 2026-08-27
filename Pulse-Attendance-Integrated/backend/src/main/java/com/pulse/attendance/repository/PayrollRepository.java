package com.pulse.attendance.repository;

import com.pulse.attendance.entity.PayrollRecord;
import org.springframework.data.jpa.repository.JpaRepository;

import java.time.YearMonth;
import java.util.List;
import java.util.Optional;

public interface PayrollRepository extends JpaRepository<PayrollRecord, Long> {
    Optional<PayrollRecord> findByEmployeeIdAndMonth(Long employeeId, YearMonth month);

    List<PayrollRecord> findByEmployeeId(Long employeeId);

    List<PayrollRecord> findByMonth(YearMonth month);
}
