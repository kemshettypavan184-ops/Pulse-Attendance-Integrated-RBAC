# Pulse Attendance - End-to-End Repair Report

## Scope
This repair follows the supplied functional audit requirements: every visible feature should use the real frontend -> API -> Spring Security -> service -> repository -> PostgreSQL -> response -> UI chain.

## Actual role model discovered
The codebase currently defines:
- ADMIN
- MANAGER
- EMPLOYEE

There is no HR_ADMIN or PAYROLL_ADMIN enum in this version. Therefore the repair preserves the existing role model. ADMIN is the organization/HR-admin experience already implemented by the application.

## Root causes found

1. Employee accounts could have `employeeId = null`.
   - Signup did not link an existing employee record.
   - Existing accounts were not backfilled on login.
   - `/api/v1/me/attendance`, `/api/v1/me/leaves`, and `/api/v1/me/profile` therefore had no employee identity to use.

2. Employee dashboard icon labels were rendered as plain strings.
   - `StatCard` rendered values such as `check`, `clock`, `home`, and `leave` as text instead of using the existing SVG icon system.

3. Employee dashboard used UTC conversion for today's attendance key.
   - This could mismatch the local calendar date.

4. Leave validation was mostly frontend-only.
   - The backend accepted invalid ranges and client-supplied `numberOfDays`.
   - There was no server-side overlap protection.

5. Leave approval accepted an `approvedBy` query parameter from the client.
   - The approving identity should come from the authenticated security context.

6. Navigation did not expose a working Leave or Payroll page even though the backend functionality existed.
   - Working pages were added rather than adding dead links.

7. Monthly employee leave statistics were based on an `ON_LEAVE` attendance status that does not exist in the backend `AttendanceStatus` enum.
   - Leave days are now derived from approved leave records.

## Changes made

### Backend
- Added case-insensitive employee email lookup.
- Linked employee accounts to existing employee records during signup.
- Backfilled the employee link during login for older accounts.
- Added server-side leave validation.
- Server calculates leave day count.
- Added pending/approved leave overlap detection.
- Prevented approving/rejecting a non-pending leave.
- Approver identity is taken from authenticated `Authentication`.
- Preserved BCrypt + JWT + Spring Security.
- Preserved the actual ADMIN/MANAGER/EMPLOYEE role model.

### Frontend
- Fixed employee dashboard icons.
- Fixed local-date handling for today's attendance.
- Leave-day calculation now uses approved leave records.
- Added required reason validation before leave submission.
- Added role-aware Leave navigation.
- Added functional Leave page.
- Added functional Payroll page for ADMIN/MANAGER.
- Existing attendance page continues to use `/api/v1/me/attendance` for EMPLOYEE and secured all-attendance endpoint for ADMIN/MANAGER.
- Existing protected routes and JWT API client remain in use.
- Auth session restoration now attempts to resolve a missing employee link from `/api/v1/me/profile`.

## Main API mapping

| Feature | Frontend | Backend |
|---|---|---|
| Login | POST /api/v1/auth/login | AuthController -> AuthService |
| Employee dashboard | GET /api/v1/dashboard/stats | DashboardController -> DashboardService |
| Own profile | GET /api/v1/me/profile | MeController -> EmployeeService |
| Own attendance | GET /api/v1/me/attendance | MeController -> AttendanceService |
| Check in | POST /api/v1/me/attendance/check-in | MeController -> AttendanceService |
| Check out | PUT /api/v1/me/attendance/check-out | MeController -> AttendanceService |
| Apply leave | POST /api/v1/me/leaves | MeController -> LeaveService |
| Own leaves | GET /api/v1/me/leaves | MeController -> LeaveService |
| Admin attendance | GET /api/v1/attendance/date/{date} | AttendanceController |
| Employees | GET /api/v1/employees | EmployeeController |
| Pending leaves | GET /api/v1/leaves/pending | LeaveController |
| Approve leave | PUT /api/v1/leaves/{id}/approve | LeaveController -> LeaveService |
| Reject leave | PUT /api/v1/leaves/{id}/reject | LeaveController -> LeaveService |
| Payroll | GET /api/v1/payroll/month/{month} | PayrollController -> PayrollService |

## RBAC observed

| Module | EMPLOYEE | MANAGER | ADMIN |
|---|---|---|---|
| Dashboard | Own | Manager scope | Organization |
| Own attendance | Yes | Through manager APIs | Yes |
| All attendance | No | Yes | Yes |
| Own leave | Yes | Yes | Yes |
| Leave approval | No | Existing controller permission | Yes |
| Employees | No | Yes | Yes |
| Payroll | No | Yes | Yes |
| Administration | No | No | Admin-only areas |

The exact role/permission model remains based on the actual source code instead of introducing unsupported HR_ADMIN/PAYROLL_ADMIN roles.

## Verification

### Source checks
- Modified frontend files have balanced JSX/TypeScript delimiters.
- Modified Java files have balanced braces.
- Frontend dependency installation/build could not be completed in this environment because `npm ci` timed out.
- Maven is not installed in this environment, so a Maven compile could not be executed here.

## Local verification commands

Frontend:
```bash
cd frontend
npm install
npm run build
npm run dev
```

Backend:
```bash
cd backend
mvn clean install
mvn spring-boot:run
```

## Important test sequence

1. Ensure an employee row exists with the same email as the employee login account.
2. Restart the backend.
3. Log out and log in again, or clear the old `pulse_user` storage.
4. Confirm the employee dashboard displays Employee ID.
5. Click Check In and verify an attendance row is created in PostgreSQL.
6. Click Check Out and verify checkout time is saved.
7. Apply leave and verify a PENDING row exists.
8. Log in as ADMIN and verify the request appears under Leave.
9. Approve/reject it and verify the employee sees the updated status.
10. Verify unauthorized role/API access returns 401/403 as appropriate.

## Leave Management Frontend Repair (2026-08-25)
- Reworked `frontend/app/leave/page.tsx` to use the correct self-service endpoint for employees (`/api/v1/me/leaves`) and management endpoint for ADMIN/MANAGER (`/api/v1/leaves`).
- Added ADMIN/MANAGER employee selection so managers/admins can create a leave request on behalf of an employee.
- Added working Apply/Create Leave CTA even when the database is empty.
- Added All/Pending/Approved/Rejected filters, search, refresh, approval/rejection, and management deletion.
- Added validation for date range, reason, employee selection, and employee-profile linkage.
- Added calculated number of days while retaining backend calculation as the source of truth.
- Added success/error feedback and loading/disabled states.
