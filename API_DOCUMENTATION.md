# API Documentation - Employee Shift Roster System

This document provides comprehensive documentation for all API endpoints in the Employee Shift Roster application.

## 🔐 Authentication


**Note:** Authentication is currently disabled for most endpoints during testing. Only login and Google OAuth endpoints require credentials for now. JWT tokens will be required for all endpoints after testing is complete.

All API endpoints (except login) require JWT authentication (when enabled). Include the token in the Authorization header:

```
Authorization: Bearer <your-jwt-token>
```

### Authentication Flow

1. **Login** with credentials or Google OAuth
2. **Receive** JWT access token and refresh token
3. **Include** access token in all subsequent requests
4. **Refresh** token when it expires

## 📋 Base URL

- **Development**: `http://localhost:5001/api`
- **Production**: `https://your-api-domain.com/api`

## 🔑 Authentication Endpoints

### POST /auth/login
Login with email and password or demo account.

**Request Body:**
```json
{
  "email": "admin@company.com",
  "password": "admin123",
  "login_type": "demo"
}
```

**Response:**
```json
{
  "access_token": "eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9...",
  "refresh_token": "eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9...",
  "user": {
    "id": 1,
    "name": "Admin User",
    "email": "admin@company.com",
    "role": "Admin"
  }
}
```

### POST /auth/refresh
Refresh expired access token.

**Headers:**
```
Authorization: Bearer <refresh-token>
```

**Response:**
```json
{
  "access_token": "eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9..."
}
```

### POST /auth/logout
Logout and invalidate tokens.

**Headers:**
```
Authorization: Bearer <access-token>
```

**Response:**
```json
{
  "message": "Successfully logged out"
}
```

## 👥 Employee Management

### GET /employees
Get list of all employees with filtering and pagination.

**Query Parameters:**
- `page` (int): Page number (default: 1)
- `per_page` (int): Items per page (default: 10)
- `role` (string): Filter by role name
- `area` (string): Filter by area name
- `search` (string): Search in name, surname, or email
- `is_active` (boolean): Filter by active status

**Response:**
```json
{
  "employees": [
    {
      "id": 1,
      "employee_id": "EMP001",
      "name": "John",
      "surname": "Doe",
      "email": "john.doe@company.com",
      "contact_number": "+1234567890",
      "role": {
        "id": 1,
        "name": "Employee"
      },
      "area": {
        "id": 1,
        "name": "Kitchen"
      },
      "skills": [
        {
          "id": 1,
          "name": "Food Preparation"
        }
      ],
      "hire_date": "2024-01-15",
      "is_active": true
    }
  ],
  "pagination": {
    "page": 1,
    "pages": 5,
    "per_page": 10,
    "total": 45
  }
}
```

### POST /employees
Create a new employee.

**Required Role:** Admin

**Request Body:**
```json
{
  "employee_id": "EMP002",
  "name": "Jane",
  "surname": "Smith",
  "email": "jane.smith@company.com",
  "contact_number": "+1234567891",
  "role_id": 2,
  "area_id": 1,
  "skill_ids": [1, 2],
  "hire_date": "2024-02-01",
  "is_active": true
}
```

**Response:**
```json
{
  "message": "Employee created successfully",
  "employee": {
    "id": 2,
    "employee_id": "EMP002",
    "name": "Jane",
    "surname": "Smith",
    "email": "jane.smith@company.com"
  }
}
```

### PUT /employees/{id}
Update an existing employee.

**Required Role:** Admin

**Request Body:** Same as POST /employees

**Response:**
```json
{
  "message": "Employee updated successfully",
  "employee": {
    "id": 2,
    "employee_id": "EMP002",
    "name": "Jane",
    "surname": "Smith"
  }
}
```

### DELETE /employees/{id}
Delete an employee.

**Required Role:** Admin

**Response:**
```json
{
  "message": "Employee deleted successfully"
}
```

### GET /employees/{id}
Get a specific employee by ID.

**Response:**
```json
{
  "id": 1,
  "employee_id": "EMP001",
  "name": "John",
  "surname": "Doe",
  "email": "john.doe@company.com",
  "contact_number": "+1234567890",
  "role": {
    "id": 1,
    "name": "Employee",
    "description": "Regular employee"
  },
  "area": {
    "id": 1,
    "name": "Kitchen",
    "description": "Kitchen operations"
  },
  "skills": [
    {
      "id": 1,
      "name": "Food Preparation",
      "category": "Culinary"
    }
  ],
  "hire_date": "2024-01-15",
  "is_active": true
}
```

## 📅 Shift Roster Management

### GET /roster
Get shift roster with filtering options.

**Query Parameters:**
- `start_date` (string): Start date (YYYY-MM-DD)
- `end_date` (string): End date (YYYY-MM-DD)
- `employee_id` (int): Filter by employee
- `shift_id` (int): Filter by shift type
- `status` (string): Filter by status (pending, approved, rejected)

**Response:**
```json
{
  "roster": [
    {
      "id": 1,
      "date": "2024-01-15",
      "employee": {
        "id": 1,
        "name": "John Doe",
        "employee_id": "EMP001"
      },
      "shift": {
        "id": 1,
        "name": "Morning Shift",
        "start_time": "08:00",
        "end_time": "16:00",
        "duration_hours": 8
      },
      "status": "approved",
      "approved_by": {
        "id": 2,
        "name": "Manager User"
      },
      "approved_at": "2024-01-14T10:30:00Z",
      "created_at": "2024-01-14T09:00:00Z"
    }
  ]
}
```

### POST /roster
Create a new shift assignment.

**Required Role:** Manager or Admin

**Request Body:**
```json
{
  "employee_id": 1,
  "shift_id": 1,
  "date": "2024-01-16"
}
```

**Response:**
```json
{
  "message": "Shift assignment created successfully",
  "roster": {
    "id": 2,
    "date": "2024-01-16",
    "employee_id": 1,
    "shift_id": 1,
    "status": "pending"
  }
}
```

### PUT /roster/{id}
Update a shift assignment.

**Required Role:** Manager or Admin

**Request Body:**
```json
{
  "employee_id": 2,
  "shift_id": 2,
  "date": "2024-01-16",
  "status": "approved"
}
```

### DELETE /roster/{id}
Delete a shift assignment.

**Required Role:** Manager or Admin

**Response:**
```json
{
  "message": "Shift assignment deleted successfully"
}
```

### POST /roster/{id}/approve
Approve a shift assignment.

**Required Role:** Manager or Admin

**Response:**
```json
{
  "message": "Shift assignment approved successfully",
  "roster": {
    "id": 1,
    "status": "approved",
    "approved_at": "2024-01-14T10:30:00Z"
  }
}
```

### POST /roster/{id}/reject
Reject a shift assignment.

**Required Role:** Manager or Admin

**Request Body:**
```json
{
  "reason": "Employee not available"
}
```

**Response:**
```json
{
  "message": "Shift assignment rejected successfully",
  "roster": {
    "id": 1,
    "status": "rejected",
    "rejection_reason": "Employee not available"
  }
}
```

### POST /roster/bulk
Create multiple shift assignments.

**Required Role:** Manager or Admin

**Request Body:**
```json
{
  "assignments": [
    {
      "employee_id": 1,
      "shift_id": 1,
      "date": "2024-01-16"
    },
    {
      "employee_id": 2,
      "shift_id": 2,
      "date": "2024-01-16"
    }
  ]
}
```

**Response:**
```json
{
  "message": "Bulk shift assignments created successfully",
  "created": 2,
  "failed": 0,
  "errors": []
}
```

## 🏢 Administrative Endpoints

### Roles Management

#### GET /roles
Get all roles.

**Response:**
```json
{
  "roles": [
    {
      "id": 1,
      "name": "Admin",
      "description": "System administrator with full access"
    },
    {
      "id": 2,
      "name": "Manager",
      "description": "Team manager with employee and shift management access"
    }
  ]
}
```

#### POST /roles
Create a new role.

**Required Role:** Admin

**Request Body:**
```json
{
  "name": "Supervisor",
  "description": "Shift supervisor with limited management access"
}
```

#### PUT /roles/{id}
Update a role.

**Required Role:** Admin

#### DELETE /roles/{id}
Delete a role.

**Required Role:** Admin

### Areas Management

#### GET /areas
Get all work areas.

**Response:**
```json
{
  "areas": [
    {
      "id": 1,
      "name": "Kitchen",
      "description": "Food preparation and cooking area"
    },
    {
      "id": 2,
      "name": "Service",
      "description": "Customer service and front-of-house"
    }
  ]
}
```

#### POST /areas
Create a new work area.

**Required Role:** Admin

#### PUT /areas/{id}
Update a work area.

**Required Role:** Admin

#### DELETE /areas/{id}
Delete a work area.

**Required Role:** Admin

### Skills Management

#### GET /skills
Get all skills.

**Response:**
```json
{
  "skills": [
    {
      "id": 1,
      "name": "Food Preparation",
      "description": "Ability to prepare various food items",
      "category": "Culinary"
    },
    {
      "id": 2,
      "name": "Customer Service",
      "description": "Excellent customer interaction skills",
      "category": "Service"
    }
  ]
}
```

#### POST /skills
Create a new skill.

**Required Role:** Admin

#### PUT /skills/{id}
Update a skill.

**Required Role:** Admin

#### DELETE /skills/{id}
Delete a skill.

**Required Role:** Admin

### Shifts Management

#### GET /shifts
Get all shift types.

**Response:**
```json
{
  "shifts": [
    {
      "id": 1,
      "name": "Morning Shift",
      "start_time": "08:00",
      "end_time": "16:00",
      "duration_hours": 8
    },
    {
      "id": 2,
      "name": "Evening Shift",
      "start_time": "16:00",
      "end_time": "00:00",
      "duration_hours": 8
    }
  ]
}
```

#### POST /shifts
Create a new shift type.

**Required Role:** Admin

**Request Body:**
```json
{
  "name": "Night Shift",
  "start_time": "00:00",
  "end_time": "08:00",
  "duration_hours": 8
}
```

#### PUT /shifts/{id}
Update a shift type.

**Required Role:** Admin

#### DELETE /shifts/{id}
Delete a shift type.

**Required Role:** Admin

## 📊 Analytics Endpoints

### GET /analytics/dashboard
Get dashboard analytics data.

**Required Role:** Manager or Admin

**Query Parameters:**
- `start_date` (string): Start date for analytics
- `end_date` (string): End date for analytics

**Response:**
```json
{
  "summary": {
    "total_employees": 35,
    "active_shifts": 197,
    "approval_rate": 94,
    "utilization_rate": 92
  },
  "employee_distribution": {
    "by_role": [
      {"role": "Admin", "count": 2},
      {"role": "Manager", "count": 5},
      {"role": "Employee", "count": 25}
    ],
    "by_area": [
      {"area": "Kitchen", "count": 12},
      {"area": "Service", "count": 18},
      {"area": "Management", "count": 5}
    ]
  },
  "shift_metrics": {
    "utilization": [
      {"shift": "Morning", "planned": 15, "actual": 14},
      {"shift": "Evening", "planned": 18, "actual": 16}
    ],
    "approval_trends": [
      {"week": "Week 1", "approved": 85, "pending": 12, "rejected": 3},
      {"week": "Week 2", "approved": 92, "pending": 6, "rejected": 2}
    ]
  }
}
```

### GET /analytics/employees
Get employee-specific analytics.

**Required Role:** Manager or Admin

**Response:**
```json
{
  "employee_metrics": [
    {
      "employee_id": 1,
      "name": "John Doe",
      "total_shifts": 20,
      "hours_worked": 160,
      "attendance_rate": 95,
      "skills_count": 3
    }
  ],
  "availability": {
    "available": 28,
    "on_shift": 15,
    "on_leave": 5,
    "sick_leave": 2
  }
}
```

### GET /analytics/shifts
Get shift-specific analytics.

**Required Role:** Manager or Admin

**Response:**
```json
{
  "shift_analytics": [
    {
      "shift_name": "Morning Shift",
      "total_assignments": 45,
      "average_utilization": 93,
      "most_assigned_area": "Kitchen"
    }
  ],
  "coverage": {
    "monday": {"morning": 15, "evening": 12, "night": 8},
    "tuesday": {"morning": 16, "evening": 13, "night": 7}
  }
}
```

## 📤 Export Endpoints

### GET /export/employees/csv
Export employees to CSV format.

**Required Role:** Manager or Admin

**Response:** CSV file download

### GET /export/employees/excel
Export employees to Excel format.

**Required Role:** Manager or Admin

**Response:** Excel file download

### GET /export/roster/csv
Export roster to CSV format.

**Required Role:** Manager or Admin

**Query Parameters:**
- `start_date` (string): Start date filter
- `end_date` (string): End date filter

**Response:** CSV file download

### GET /export/roster/excel
Export roster to Excel format.

**Required Role:** Manager or Admin

**Response:** Excel file download

### GET /export/timesheets/pdf
Export timesheets to PDF format.

**Required Role:** Manager or Admin

**Query Parameters:**
- `start_date` (string): Start date filter
- `end_date` (string): End date filter
- `employee_id` (int): Specific employee filter

**Response:** PDF file download

### GET /export/analytics/pdf
Export analytics report to PDF format.

**Required Role:** Manager or Admin

**Response:** PDF file download

### GET /export/templates/employees
Download employee import template.

**Required Role:** Manager or Admin

**Response:** CSV template file

## 📥 Import Endpoints

### POST /import/employees/validate
Validate employee import file.

**Required Role:** Admin

**Request:** Multipart form data with file

**Response:**
```json
{
  "valid": true,
  "total_rows": 25,
  "missing_columns": [],
  "available_columns": ["Employee ID", "Name", "Surname", "Email"],
  "warnings": [
    "Employee ID EMP001 already exists in database"
  ],
  "sample_data": [
    {
      "Employee ID": "EMP025",
      "Name": "John",
      "Surname": "Doe",
      "Email": "john.doe@company.com"
    }
  ]
}
```

### POST /import/employees/csv
Import employees from CSV file.

**Required Role:** Admin

**Request:** Multipart form data with file

**Response:**
```json
{
  "message": "Successfully imported 23 employees",
  "imported_count": 23,
  "errors": [
    "Row 5: Employee ID EMP005 already exists",
    "Row 12: Invalid email format"
  ]
}
```

### POST /import/backup/create
Create system backup.

**Required Role:** Admin

**Response:** JSON backup file download

### POST /import/backup/restore
Restore from backup file.

**Required Role:** Admin

**Request:** Multipart form data with backup file

**Response:**
```json
{
  "message": "System restored successfully from backup",
  "restored_items": {
    "employees": 35,
    "roles": 4,
    "areas": 5,
    "skills": 12,
    "shifts": 3
  }
}
```

## ❌ Error Responses

### Standard Error Format

```json
{
  "error": "Error message description",
  "code": "ERROR_CODE",
  "details": {
    "field": "Additional error details"
  }
}
```

### HTTP Status Codes

- **200**: Success
- **201**: Created
- **400**: Bad Request
- **401**: Unauthorized
- **403**: Forbidden
- **404**: Not Found
- **422**: Validation Error
- **500**: Internal Server Error

### Common Error Codes

- `INVALID_CREDENTIALS`: Login failed
- `TOKEN_EXPIRED`: JWT token has expired
- `INSUFFICIENT_PERMISSIONS`: User lacks required role
- `VALIDATION_ERROR`: Request data validation failed
- `RESOURCE_NOT_FOUND`: Requested resource doesn't exist
- `DUPLICATE_ENTRY`: Attempting to create duplicate record

## 🔧 Rate Limiting

API endpoints are rate limited to prevent abuse:

- **Authentication endpoints**: 5 requests per minute
- **Read operations**: 100 requests per minute
- **Write operations**: 30 requests per minute
- **Export operations**: 10 requests per minute

Rate limit headers are included in responses:
```
X-RateLimit-Limit: 100
X-RateLimit-Remaining: 95
X-RateLimit-Reset: 1640995200
```

## 📝 Request/Response Examples

### Complete Employee Creation Example

**Request:**
```bash
curl -X POST http://localhost:5001/api/employees \
  -H "Authorization: Bearer eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9..." \
  -H "Content-Type: application/json" \
  -d '{
    "employee_id": "EMP003",
    "name": "Alice",
    "surname": "Johnson",
    "email": "alice.johnson@company.com",
    "contact_number": "+1234567892",
    "role_id": 2,
    "area_id": 1,
    "skill_ids": [1, 3],
    "hire_date": "2024-03-01",
    "is_active": true
  }'
```

**Response:**
```json
{
  "message": "Employee created successfully",
  "employee": {
    "id": 3,
    "employee_id": "EMP003",
    "name": "Alice",
    "surname": "Johnson",
    "email": "alice.johnson@company.com",
    "contact_number": "+1234567892",
    "role": {
      "id": 2,
      "name": "Manager"
    },
    "area": {
      "id": 1,
      "name": "Kitchen"
    },
    "skills": [
      {
        "id": 1,
        "name": "Food Preparation"
      },
      {
        "id": 3,
        "name": "Team Leadership"
      }
    ],
    "hire_date": "2024-03-01",
    "is_active": true,
    "created_at": "2024-01-15T10:30:00Z"
  }
}
```

This API documentation provides comprehensive information for integrating with the Employee Shift Roster system, including all endpoints, request/response formats, authentication requirements, and error handling.

