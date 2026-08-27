# Pulse Attendance Backend

A comprehensive Spring Boot REST API for managing employee attendance, leaves, and payroll in an organization.

## Project Overview

Pulse Attendance Backend is a robust attendance management system that provides features for:

- Employee management
- Attendance tracking
- Leave management
- Payroll processing
- Manager and HR Admin dashboards

## Technology Stack

- **Framework**: Spring Boot 3.1.5
- **Language**: Java 17
- **Database**: H2 (Development) / MySQL (Production)
- **ORM**: Spring Data JPA / Hibernate
- **Mapping**: ModelMapper
- **Security**: Spring Security
- **Testing**: JUnit 5, Mockito
- **Build**: Maven

## Project Structure

```
pulse-attendance-backend/
├── pom.xml
├── README.md
├── .gitignore
└── src/
    ├── main/
    │   ├── java/com/pulse/attendance/
    │   │   ├── PulseAttendanceApplication.java
    │   │   ├── controller/
    │   │   ├── service/
    │   │   ├── repository/
    │   │   ├── entity/
    │   │   ├── dto/
    │   │   ├── exception/
    │   │   ├── enums/
    │   │   └── config/
    │   └── resources/
    │       └── application.properties
    └── test/
        └── java/com/pulse/attendance/
```

## Key Features

### 1. Employee Management

- Create, read, update, and delete employee records
- Track employee details (personal info, department, designation, salary)
- Filter employees by department
- Manage employee status (Active, Inactive, On Leave, Terminated, Suspended)

### 2. Attendance Tracking

- Mark daily attendance with check-in and check-out times
- Track attendance status (Present, Absent, Late, Half Day, Work from Home)
- Query attendance records by employee and date range
- Generate attendance reports

### 3. Leave Management

- Apply for leaves (multiple leave types: Casual, Sick, Earned, Maternity, etc.)
- Track leave requests with approval workflow
- Manager approval/rejection of leave requests
- Track leave balance and history

### 4. Payroll Management

- Generate monthly payroll records
- Calculate gross and net salary
- Track deductions and working days
- Query payroll by employee and month

### 5. Role-Based Features

- **Employee**: View own records, apply for leaves
- **Manager**: View team attendance, approve/reject leave requests
- **HR Admin**: View all employees, manage leave approvals, generate payroll

## API Endpoints

### Employee Endpoints

- `POST /api/v1/employees` - Create employee
- `GET /api/v1/employees/{id}` - Get employee by ID
- `GET /api/v1/employees` - Get all employees
- `GET /api/v1/employees/department/{department}` - Get employees by department
- `PUT /api/v1/employees/{id}` - Update employee
- `DELETE /api/v1/employees/{id}` - Delete employee

### Attendance Endpoints

- `POST /api/v1/attendance` - Mark attendance
- `GET /api/v1/attendance/{id}` - Get attendance record
- `GET /api/v1/attendance/employee/{employeeId}` - Get employee attendance with date range
- `GET /api/v1/attendance/date/{date}` - Get attendance by date
- `GET /api/v1/attendance` - Get all attendance records
- `PUT /api/v1/attendance/{id}` - Update attendance
- `DELETE /api/v1/attendance/{id}` - Delete attendance

### Leave Endpoints

- `POST /api/v1/leaves` - Apply for leave
- `GET /api/v1/leaves/{id}` - Get leave record
- `GET /api/v1/leaves/employee/{employeeId}` - Get employee leaves
- `GET /api/v1/leaves/employee/{employeeId}/date-range` - Get leaves by date range
- `GET /api/v1/leaves/pending` - Get pending leaves
- `GET /api/v1/leaves` - Get all leaves
- `PUT /api/v1/leaves/{id}/approve` - Approve leave
- `PUT /api/v1/leaves/{id}/reject` - Reject leave
- `DELETE /api/v1/leaves/{id}` - Delete leave

### Manager Endpoints

- `GET /api/v1/manager/team-attendance` - Get team attendance
- `GET /api/v1/manager/team-leave-requests` - Get team leave requests
- `PUT /api/v1/manager/approve-leave/{leaveId}` - Approve leave
- `PUT /api/v1/manager/reject-leave/{leaveId}` - Reject leave

### HR Admin Endpoints

- `GET /api/v1/hr-admin/all-employees` - Get all employees
- `GET /api/v1/hr-admin/all-leave-requests` - Get all leave requests
- `GET /api/v1/hr-admin/pending-leave-requests` - Get pending leaves
- `POST /api/v1/hr-admin/approve-all-pending-leaves` - Approve all pending leaves
- `GET /api/v1/hr-admin/dashboard-stats` - Get dashboard statistics

### Payroll Endpoints

- `POST /api/v1/payroll/generate` - Generate payroll
- `GET /api/v1/payroll/{id}` - Get payroll record
- `GET /api/v1/payroll/employee/{employeeId}` - Get employee payroll
- `GET /api/v1/payroll/employee/{employeeId}/month/{month}` - Get payroll by employee and month
- `GET /api/v1/payroll/month/{month}` - Get payroll by month
- `GET /api/v1/payroll` - Get all payroll records
- `DELETE /api/v1/payroll/{id}` - Delete payroll record

## Setup and Installation

### Prerequisites

- Java 17 or higher
- Maven 3.6+
- (Optional) MySQL 8.0+

### Steps

1. **Clone the repository**

   ```bash
   git clone https://github.com/yourusername/pulse-attendance-backend.git
   cd pulse-attendance-backend
   ```

2. **Build the project**

   ```bash
   mvn clean install
   ```

3. **Run the application**

   ```bash
   mvn spring-boot:run
   ```

4. **Access the application**
   - API Base URL: `http://localhost:8080/api`
   - H2 Console: `http://localhost:8080/api/h2-console` (for development)

### Database Configuration

**For H2 (Development - Default)**
No additional setup required. H2 is configured in `application.properties`.

**For MySQL (Production)**
Update `application.properties`:

```properties
spring.datasource.url=jdbc:mysql://localhost:3306/pulse_attendance
spring.datasource.username=root
spring.datasource.password=your_password
spring.jpa.properties.hibernate.dialect=org.hibernate.dialect.MySQL8Dialect
spring.jpa.hibernate.ddl-auto=update
```

## Testing

Run unit tests:

```bash
mvn test
```

Run specific test class:

```bash
mvn test -Dtest=EmployeeServiceTest
```

## Project Dependencies

- Spring Boot Starter Web
- Spring Boot Starter Data JPA
- Spring Boot Starter Security
- Spring Boot Starter Validation
- ModelMapper (for DTO mapping)
- Lombok (for reducing boilerplate)
- JUnit 5 & Mockito (for testing)

## Error Handling

The API implements comprehensive error handling with custom exceptions:

- `ResourceNotFoundException` - Returns 404 when resource is not found
- `DuplicateResourceException` - Returns 409 when duplicate resource exists
- Global exception handler returns standardized error responses

## Future Enhancements

- JWT authentication and authorization
- Email notifications for leave approvals
- Advanced reporting and analytics
- Mobile app integration
- Biometric attendance integration
- Advanced leave policies and customization

## Contributing

Contributions are welcome! Please follow these steps:

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Contact

For questions or support, please contact:

- Email: support@pulseattendance.com
- Website: https://pulseattendance.com

## Changelog

### Version 1.0.0 (Initial Release)

- Core attendance management features
- Employee management
- Leave management
- Payroll processing
- Role-based access control


## New Enhancements

### Advanced Employee Search
`GET /api/v1/employees/search` supports optional `name`, `employeeId`, `email`, `department`, `designation`, and `status` filters plus `page`, `size`, and `sort`.

Example:
`/api/v1/employees/search?department=IT&status=ACTIVE&page=0&size=10&sort=fullName,asc`

### Swagger
After starting the application, open `/swagger-ui/index.html`.

### Profiles
Development: `mvn spring-boot:run -Dspring-boot.run.profiles=dev`
Production: `mvn spring-boot:run -Dspring-boot.run.profiles=prod`

### API responses
Successful APIs return `{success,message,data,timestamp}` and errors use a standardized error response with HTTP status and request path.


## Entity Relationships
The module already contains the applicable attendance-domain relationships and they are preserved: Employee has many Attendance records, many Leave records, and many PayrollRecord records; Attendance, Leave, and PayrollRecord each have a Many-to-One relationship to Employee. No artificial One-to-One or Many-to-Many relationship was added.

## Authentication and RBAC (added for frontend integration)

The application now includes JWT authentication and role-based authorization used by the Next.js frontend.

### Auth endpoints

- `POST /api/v1/auth/signup` - create a public EMPLOYEE account
- `POST /api/v1/auth/login` - authenticate and receive a JWT
- `GET /api/v1/dashboard/stats` - authenticated, role-aware dashboard statistics
- `GET /api/v1/me/profile` - authenticated employee profile when an account is linked to an employee
- `GET /api/v1/me/attendance` - authenticated employee attendance
- `GET /api/v1/me/leaves` - authenticated employee leave records

### Roles

- `ADMIN` - HR/admin endpoints, employees, attendance, payroll and manager operations
- `MANAGER` - team/employee, attendance and payroll operations allowed by the API
- `EMPLOYEE` - authenticated personal workspace; personal `/api/v1/me/*` endpoints are used by the frontend

Public signup never accepts a role. New accounts are always created as `EMPLOYEE` so a client cannot self-assign `ADMIN` or `MANAGER`.

### Development administrator

On first startup the backend creates:

- Username: `admin`
- Password: `admin123`
- Role: `ADMIN`

Change/remove this development credential before production deployment. Override `JWT_SECRET` with a strong secret in production.

### Frontend connection

The frontend uses `NEXT_PUBLIC_API_URL` and defaults to `http://localhost:8080`. The included `frontend/.env.local` sets the development value.

### Swagger JWT Authorization

Swagger UI now exposes an **Authorize** button at the top-right. After calling
`POST /api/v1/auth/login`, copy the JWT returned in the response and enter the
token in the Authorize dialog. Swagger will send it automatically as:

`Authorization: Bearer <JWT>`

The authentication scheme is defined in `config/OpenApiConfig.java`.
