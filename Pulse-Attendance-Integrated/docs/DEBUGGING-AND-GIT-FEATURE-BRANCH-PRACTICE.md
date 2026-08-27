# IntelliJ Debugging and GitHub Feature Branch Practice

## Assigned Module

**Module:** Attendance  
**Primary classes:** `AttendanceController`, `AttendanceService`, `AttendanceRepository`  
**Debugging scenario:** Duplicate attendance can be submitted for the same employee and attendance date.

---

## 1. Issue / Error Reproduced

### Scenario

The attendance create endpoint is:

```text
POST /api/v1/attendance
```

Example request:

```json
{
  "employeeId": 1,
  "attendanceDate": "2026-08-26",
  "checkInTime": "09:00:00",
  "checkOutTime": "17:30:00",
  "status": "PRESENT",
  "remarks": "Regular day"
}
```

Before the fix, `AttendanceService.markAttendance()` checked that the employee existed but did not check whether attendance was already marked for the same employee and date.

### Reproduction steps

1. Authenticate with a user having the required Attendance role.
2. Send the attendance `POST` request with a valid employee ID and date.
3. Send the same request again for the same employee/date.
4. Observe that the second request could create another attendance record instead of returning a business conflict.

This is a data-integrity issue because an employee should have at most one attendance record for a given attendance date.

---

## 2. Application Flow

```text
Swagger / Postman / Frontend
            |
            v
AttendanceController.markAttendance()
            |
            v
AttendanceService.markAttendance()
            |
            +--> EmployeeRepository.findById()
            |
            +--> AttendanceRepository.existsByEmployeeIdAndAttendanceDate()
            |
            +--> ModelMapper
            |
            +--> AttendanceRepository.save()
            |
            v
       PostgreSQL
```

For `GET /api/v1/attendance/date/{date}`:

```text
AttendanceController.getAttendanceByDate()
            |
            v
AttendanceService.getAttendanceByDate()
            |
            v
AttendanceRepository.findByAttendanceDate()
            |
            v
       PostgreSQL
```

---

## 3. IntelliJ Debugging Procedure

Start the backend with the IntelliJ **Debug** action.

### Breakpoint 1 — Controller

Set a breakpoint inside:

```text
AttendanceController.markAttendance()
```

Inspect:

- `request`
- `request.employeeId`
- `request.attendanceDate`
- `request.status`

### Breakpoint 2 — Employee lookup

Step into:

```text
AttendanceService.markAttendance()
```

Inspect:

```text
request.employeeId
employee
```

Confirm that the requested employee exists.

### Breakpoint 3 — Duplicate check

Set a breakpoint on:

```text
attendanceRepository.existsByEmployeeIdAndAttendanceDate(...)
```

Inspect:

```text
employeeId
attendanceDate
```

Expected result for the first submission:

```text
false
```

Expected result for the duplicate submission:

```text
true
```

When the result is `true`, the service throws:

```text
DuplicateResourceException
```

and the request is returned as HTTP 409 Conflict by the global exception handler.

### Debugger controls

| IntelliJ action | Shortcut | Purpose |
|---|---|---|
| Step Into | F7 | Enter the called method |
| Step Over | F8 | Execute the current line without entering the method |
| Step Out | Shift+F8 | Return from the current method |
| Resume Program | F9 | Continue until the next breakpoint |
| Evaluate Expression | Alt+F8 | Inspect an expression while paused |

### Inspect during debugging

Check:

- Local variables
- Method parameters
- `employee` object
- `attendanceDate`
- Repository return value
- Exception message
- Call stack
- Current execution line

Do not change the code based only on the HTTP status. Trace the execution until the actual cause is confirmed.

---

## 4. Root Cause Identified

The root cause was a missing duplicate-attendance check in `AttendanceService.markAttendance()`.

The service previously followed this flow:

```text
Employee exists
     |
     v
Map request to Attendance
     |
     v
Save attendance
```

The required business check was missing:

```text
Does attendance already exist for employee + date?
```

---

## 5. Resolution Implemented

### Repository

Added:

```java
boolean existsByEmployeeIdAndAttendanceDate(
        Long employeeId,
        LocalDate attendanceDate);
```

This allows Spring Data JPA to check for an existing attendance record.

Also added:

```java
List<Attendance> findByAttendanceDate(LocalDate attendanceDate);
```

The date-based attendance API now queries the database directly instead of loading every attendance record and filtering it in Java.

### Service

`markAttendance()` now:

1. Finds the employee.
2. Checks for an existing attendance record for the employee/date.
3. Throws `DuplicateResourceException` when a duplicate exists.
4. Saves the attendance only when no duplicate exists.

The duplicate condition returns HTTP `409 Conflict` through `GlobalExceptionHandler`.

---

## 6. Validation

### Positive case

Submit attendance for an employee/date that does not have a record.

Expected:

```text
HTTP 201 Created
Attendance marked successfully
```

### Duplicate case

Submit the same employee/date again.

Expected:

```text
HTTP 409 Conflict
Attendance is already marked for employee <id> on <date>
```

### Existing functionality

After the fix, also verify:

- Get attendance by ID
- Get attendance by employee/date range
- Get attendance by date
- Get all attendance
- Update attendance
- Delete attendance
- Check-in
- Check-out
- RBAC authorization for Attendance APIs

The fix is limited to attendance creation and the date-based repository query.

---

# GitHub Feature Branch Practice

## 7. Branch Workflow

Do not develop directly on `master`, `main`, or the shared development branch.

Recommended branch:

```text
feature/attendance-debugging
```

Before starting:

```bash
git status
git fetch origin
git branch
```

Create the feature branch from the team's current shared branch:

```bash
git switch master
git pull origin master
git switch -c feature/attendance-debugging
```

If the team uses `develop` instead of `master`, replace `master` with `develop`.

---

## 8. Keep Changes Limited

This feature branch should contain only changes related to:

```text
Attendance duplicate validation
Attendance repository date query
Attendance tests
Debugging/Git documentation
```

Do not commit:

```text
node_modules/
target/
.idea/workspace.xml
temporary files
logs
local environment files
unrelated UI changes
database dumps
```

Review the working tree:

```bash
git status
```

Review the actual code changes:

```bash
git diff
```

---

## 9. Meaningful Commit

Use a clear commit message:

```bash
git add backend/src/main/java/com/pulse/attendance/service/AttendanceService.java
git add backend/src/main/java/com/pulse/attendance/repository/AttendanceRepository.java
git add backend/src/test/java/com/pulse/attendance/AttendanceServiceTest.java
git add docs/DEBUGGING-AND-GIT-FEATURE-BRANCH-PRACTICE.md

git commit -m "fix: prevent duplicate attendance records"
```

Before committing, verify:

```bash
git status
git diff --cached
```

---

## 10. Push the Feature Branch

```bash
git push -u origin feature/attendance-debugging
```

After additional work:

```bash
git add <relevant-files>
git commit -m "test: cover duplicate attendance validation"
git push
```

Avoid meaningless commits such as:

```text
update
changes
final
test
fix
```

Prefer messages that describe the actual change.

---

## 11. Pull Request Flow

The expected workflow is:

```text
feature/attendance-debugging
             |
             v
        Pull Request
             |
             v
       Code Review
             |
       +-----+-----+
       |           |
    Approved    Changes
       |           |
       |      Fix + Push
       |           |
       +-----<-----+
             |
             v
   Shared Development Branch
```

Before opening the Pull Request:

- Confirm the branch contains only relevant changes.
- Review `git diff`.
- Run the backend tests in your local environment.
- Test the API manually through Swagger/Postman.
- Confirm the duplicate request returns `409`.
- Confirm existing attendance operations still work.
- Confirm no temporary files are included.

If reviewers request changes:

```bash
git add <changed-files>
git commit -m "fix: address attendance review comments"
git push
```

The existing Pull Request will update automatically.

---

## 12. Final Debugging Report

### Issue/Error Reproduced

Duplicate attendance could be submitted for the same employee and attendance date.

### Root Cause Identified

`markAttendance()` did not check whether an attendance record already existed for the employee/date before saving.

### Debugging Approach Used

The request was traced from `AttendanceController` to `AttendanceService` and `AttendanceRepository`. Breakpoints were placed at the controller, employee lookup, duplicate check, and save flow. Variables, method parameters, repository results, object state, and the call stack were inspected. IntelliJ Step Into, Step Over, Step Out, Resume Program, and Evaluate Expression were used as appropriate.

### Resolution Implemented

Added a repository existence check and `DuplicateResourceException` handling. The date-based query was also moved to the repository so the database performs the filtering.

### Validation

The original request must succeed, the repeated employee/date request must return `409 Conflict`, and the related Attendance and RBAC functionality must be regression-tested before the Pull Request is merged.

---

## 13. Definition of Done

- [ ] Issue/scenario reproduced
- [ ] Application flow traced
- [ ] Breakpoints added in IntelliJ
- [ ] Step Into practiced
- [ ] Step Over practiced
- [ ] Step Out practiced
- [ ] Resume Program practiced
- [ ] Variables inspected
- [ ] Method parameters inspected
- [ ] Object state inspected
- [ ] Call stack inspected
- [ ] Expression evaluated where useful
- [ ] Root cause identified
- [ ] Fix implemented
- [ ] Same scenario retested
- [ ] Regression testing completed
- [ ] Feature branch created
- [ ] Only relevant files changed
- [ ] Meaningful commit created
- [ ] Feature branch pushed
- [ ] Self-review completed
- [ ] Pull Request raised
- [ ] Review comments resolved
