export type EmployeeProfile = {
    id: number;
    employeeId: string;
    fullName: string;
    email: string;
    phoneNumber?: string | null;
    dateOfBirth?: string | null;
    joinDate?: string | null;
    department?: string | null;
    designation?: string | null;
    status?: string | null;
    reportingManager?: string | null;
    managerId?: number | null;
    salary?: number | null;
    createdAt?: string | null;
    updatedAt?: string | null;
};
