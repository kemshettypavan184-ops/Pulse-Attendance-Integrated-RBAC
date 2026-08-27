package com.pulse.attendance.specification;

import com.pulse.attendance.entity.Employee;
import com.pulse.attendance.enums.EmployeeStatus;
import org.springframework.data.jpa.domain.Specification;

public final class EmployeeSpecification {

    private EmployeeSpecification() {
    }

    public static Specification<Employee> fullNameContains(String value) {
        return (root, query, cb) -> cb.like(cb.lower(root.get("fullName")), "%" + value.toLowerCase() + "%");
    }

    public static Specification<Employee> employeeIdContains(String value) {
        return (root, query, cb) -> cb.like(cb.lower(root.get("employeeId")), "%" + value.toLowerCase() + "%");
    }

    public static Specification<Employee> emailContains(String value) {
        return (root, query, cb) -> cb.like(cb.lower(root.get("email")), "%" + value.toLowerCase() + "%");
    }

    public static Specification<Employee> departmentContains(String value) {
        return (root, query, cb) -> cb.like(cb.lower(root.get("department")), "%" + value.toLowerCase() + "%");
    }

    public static Specification<Employee> designationContains(String value) {
        return (root, query, cb) -> cb.like(cb.lower(root.get("designation")), "%" + value.toLowerCase() + "%");
    }

    public static Specification<Employee> statusEquals(EmployeeStatus value) {
        return (root, query, cb) -> cb.equal(root.get("status"), value);
    }
}
