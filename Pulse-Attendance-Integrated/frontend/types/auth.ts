export type Role = 'ADMIN' | 'MANAGER' | 'EMPLOYEE';
export type AuthUser = { username: string; email: string; fullName: string; role: Role; employeeId: number | null };
export type AuthResponse = AuthUser & { token: string; tokenType: string };
