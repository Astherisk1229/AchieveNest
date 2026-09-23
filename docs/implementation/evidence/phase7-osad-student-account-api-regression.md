# AchieveNest — Plan 03 Phase 7 API Regression Evidence

## 1. Student Accounts Directory Endpoint

- **Endpoint**: `GET /api/v1/osad/students`
- **Method**: `GET`
- **Controller**: `App\Controllers\Api\TargetProvisioningController::listStudents`
- **Query Parameters**:
  - `search`: Substring search across `profiles.full_name`, `profiles.institutional_id`, `profiles.email`, `academic_programs.name`, `academic_programs.code`
  - `college` / `college_id`: Filters `colleges.code` or `colleges.id`
  - `program_id`: Filters `academic_programs.id`
  - `year_level`: Filters `student_profiles.year_level`
  - `sex`: Filters `profiles.sex`
  - `status`: Filters `profiles.status`
  - `enrollment_status`: Filters `student_profiles.enrollment_status`
- **Response Format**:
  ```json
  {
    "data": {
      "students": [
        {
          "id": "11111111-1111-1111-1111-111111111101",
          "institutional_id": "202310492",
          "student_id": "202310492",
          "full_name": "Juan Dela Cruz",
          "first_name": "Juan",
          "middle_name": "Protacio",
          "last_name": "Dela Cruz",
          "email": "juan.delacruz@ndmu.edu.ph",
          "sex": "Male",
          "college": "CEAC",
          "college_id": "col-ceac",
          "college_name": "College of Engineering, Architecture & Computing",
          "program": "BS Computer Science",
          "program_code": "BSCS",
          "academic_program_id": "prog-01",
          "year_level": "3rd Year",
          "enrollment_status": "enrolled",
          "status": "active"
        }
      ]
    }
  }
  ```
- **Performance**: Executed in **19.22ms** for 74 students in `achievenest_local`. Zero N+1 query behavior.

---

## 2. Manual Student Provisioning Endpoint

- **Endpoint**: `POST /api/v1/provisioning/manual-student`
- **Method**: `POST`
- **Controller**: `App\Controllers\Api\TargetProvisioningController::manualStudent`
- **Request Payload**:
  ```json
  {
    "institutional_id": "202610999",
    "institutional_email": "test.student@ndmu.edu.ph",
    "first_name": "Juan",
    "middle_name": "Protacio",
    "last_name": "Dela Cruz",
    "suffix": "Jr.",
    "sex": "Male",
    "academic_program_id": "prog-01",
    "year_level": "1st Year",
    "academic_year": "2025-2026"
  }
  ```
- **Response Format**:
  ```json
  {
    "data": {
      "user_id": "...",
      "institutional_id": "202610999",
      "full_name": "Juan Dela Cruz",
      "email": "test.student@ndmu.edu.ph",
      "sex": "Male",
      "account_type": "student",
      "roles": ["student"],
      "academic_program_id": "prog-01",
      "year_level": "1st Year",
      "status": "active"
    }
  }
  ```
- **Error Codes**:
  - `401 UNAUTHORIZED`: Unauthenticated session.
  - `403 FORBIDDEN`: Non-OSAD actor.
  - `409 DUPLICATE_ACCOUNT`: Duplicate institutional ID or Email.
  - `422 INVALID_SEX`: Unsupported sex value.
  - `422 INVALID_PROGRAM`: Inactive or missing program UUID.
