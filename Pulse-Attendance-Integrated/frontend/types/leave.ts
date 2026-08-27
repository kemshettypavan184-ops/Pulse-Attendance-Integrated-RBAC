export type LeaveStatus = 'PENDING' | 'APPROVED' | 'REJECTED' | string;

export type LeaveRecord = {
    id: number;
    employeeId: number;
    employeeName: string;
    leaveType: string;
    startDate: string;
    endDate: string;
    numberOfDays: number;
    reason: string | null;
    status: LeaveStatus;
    comments: string | null;
    approvedBy: string | null;
    createdAt?: string | null;
    updatedAt?: string | null;
};
