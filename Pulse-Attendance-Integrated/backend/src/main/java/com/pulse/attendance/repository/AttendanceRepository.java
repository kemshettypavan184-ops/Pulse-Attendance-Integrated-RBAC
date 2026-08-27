package com.pulse.attendance.repository;

import com.pulse.attendance.entity.Attendance;
import com.pulse.attendance.enums.AttendanceStatus;
import org.springframework.data.jpa.repository.JpaRepository;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;

public interface AttendanceRepository extends JpaRepository<Attendance, Long> {

    List<Attendance> findByEmployeeIdAndAttendanceDateBetween(
            Long employeeId,
            LocalDate startDate,
            LocalDate endDate);

    List<Attendance> findByAttendanceDateAndStatus(
            LocalDate attendanceDate,
            AttendanceStatus status);

    Optional<Attendance> findByEmployeeIdAndAttendanceDate(
            Long employeeId,
            LocalDate attendanceDate);

    boolean existsByEmployeeIdAndAttendanceDate(
            Long employeeId,
            LocalDate attendanceDate);

    List<Attendance> findByAttendanceDate(LocalDate attendanceDate);
}