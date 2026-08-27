# Pulse Attendance — Integrated RBAC

## Integrated roles

The provided projects currently define three backend roles:

- `EMPLOYEE` — personal attendance, personal leave, personal profile/dashboard.
- `MANAGER` — team-level attendance/leave and existing employee-management capabilities.
- `ADMIN` — the existing organization/HR administrator role. The HR Admin dashboard is therefore mapped to the existing `ADMIN` role.

`HR_ADMIN` and `PAYROLL_ADMIN` were **not** added because those roles do not exist in the supplied backend. Payroll is currently protected by the existing `ADMIN`/`MANAGER` rules.

## Authentication

1. Next.js login calls `POST /api/v1/auth/login`.
2. Spring Security authenticates the username/password.
3. Passwords are stored with BCrypt.
4. A JWT bearer token is returned.
5. The frontend stores the token and authenticated user in local storage.
6. `apiFetch` sends `Authorization: Bearer <token>` for protected requests.
7. `JwtAuthenticationFilter` validates the token and rebuilds the Spring Security authorities from the database user.

## Frontend RBAC

`ProtectedRoute` prevents users from opening pages outside their role. `Navbar` filters navigation items by role.

Dashboard behavior:

- `ADMIN` → HR Admin organization dashboard.
- `EMPLOYEE` → employee personal dashboard.
- `MANAGER` → manager/team summary dashboard.

Frontend checks are UX protection only. Backend authorization remains the security boundary.

## Employee self-service APIs

The integration adds secure authenticated-user endpoints:

- `GET /api/v1/me/profile`
- `GET /api/v1/me/attendance`
- `POST /api/v1/me/attendance/check-in`
- `PUT /api/v1/me/attendance/check-out`
- `GET /api/v1/me/leaves`
- `POST /api/v1/me/leaves`

The employee ID is taken from the authenticated `AppUser`; the client cannot choose another employee ID for these self-service actions.

## Existing management APIs

The existing controllers and API contracts are preserved. Organization/team management remains protected by their existing Spring Security `@PreAuthorize` rules.

## Error semantics

- `401 Unauthorized` — authentication/token failure.
- `403 Forbidden` — authenticated user lacks the required role.
- `400 Bad Request` — invalid request data.
- `404 Not Found` — requested resource does not exist.
- `500 Internal Server Error` — unexpected server failure.

## Run

Backend:

```powershell
cd backend
mvn spring-boot:run
```

Frontend:

```powershell
cd frontend
npm install
npm run dev
```

Frontend default: `http://localhost:3000`

Backend default: `http://localhost:8080`

The frontend `.env.local` should contain:

```text
NEXT_PUBLIC_API_URL=http://localhost:8080
```

## Development admin

`DataInitializer` creates the development `admin` account only when it does not already exist:

- username: `admin`
- password: `admin123`
- role: `ADMIN`

If an old `admin` database record already exists, the initializer does not overwrite its password.
