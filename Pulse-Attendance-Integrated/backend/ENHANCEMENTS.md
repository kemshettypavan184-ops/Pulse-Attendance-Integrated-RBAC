# Pulse Attendance Enhancements

Implemented the requested lead requirements on top of the existing module.

## 1. Advanced Search
- Added `GET /api/v1/employees/search`.
- Optional filters: `name`, `employeeId`, `email`, `department`, `designation`, `status`.
- Dynamic filtering via Spring Data JPA `Specification`.
- Sorting via `sort=fullName,asc` or `sort=fullName,desc`.
- Pagination via `page` and `size`.
- Page size restricted to 1-100.

Example:
`GET /api/v1/employees/search?department=IT&status=ACTIVE&page=0&size=10&sort=fullName,asc`

## 2. Global Exception Handling
- Existing `@RestControllerAdvice` retained and improved.
- Handles not-found, duplicate, validation, constraint, bad-request and unexpected errors.
- Error payload is standardized and does not expose stack traces.

## 3. API Response Standardization
- Added `ApiResponse<T>` for successful responses.
- Added `ErrorResponse` for errors.
- Added `PageResponse<T>` for paginated data.
- Existing controllers were updated to use the common success structure.

## 4. Entity Relationships
- Existing applicable relationships preserved: Employee -> Attendance, Leave and PayrollRecord (One-to-Many concept with Many-to-One owning side).
- No artificial relationship was introduced.

## 5. API Documentation
- Added Springdoc OpenAPI.
- Added OpenAPI metadata, tags and endpoint documentation.
- Swagger UI: `/swagger-ui/index.html`.

## 6. Testing
- Existing JUnit/Mockito tests retained.
- Added positive and negative-style service tests for advanced search, including multiple filters and empty results.

## 7. Logging
- Added SLF4J logging to employee, attendance, leave and payroll services.
- Added structured exception logging.
- Sensitive values are not logged.

## 8. Configuration & Profiles
- Added `application-dev.properties` and `application-prod.properties`.
- Production database settings use environment variables.
- Development keeps local PostgreSQL defaults for convenience.

## 9. Git Best Practices
Recommended workflow:
```text
git checkout -b feature/attendance-enhancements
git add .
git commit -m "Add advanced employee search"
git commit -m "Standardize API responses and exceptions"
git commit -m "Add Swagger and application logging"
git commit -m "Add dev and prod profiles"
git commit -m "Add advanced search tests"
git push origin feature/attendance-enhancements
```
