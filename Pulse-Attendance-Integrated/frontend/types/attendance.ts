export type AttendanceStatus =
    | 'PRESENT'
    | 'ABSENT'
    | 'LATE'
    | 'HALF_DAY'
    | 'WORK_FROM_HOME'
    | string;

export type AttendanceRecord = {
    id: number;
    employeeId: number;
    employeeName: string;
    attendanceDate: string;
    checkInTime: string | null;
    checkOutTime: string | null;
    status: AttendanceStatus;
    remarks: string | null;
    createdAt?: string | null;
    updatedAt?: string | null;
};
