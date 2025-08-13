# Employee Shift Roster Application - Design Document

## Overview
A comprehensive employee shift roster application with React frontend and Flask backend, featuring Google authentication, role-based access control, shift management, timesheets, and analytics.

## System Architecture

### Frontend (React)
- React application with modern UI components
- Google OAuth integration for authentication
- Drag-and-drop scheduling interface
- Interactive charts and dashboards
- Responsive design for desktop and mobile
- Export/import functionality

### Backend (Flask)
- RESTful API with Flask
- SQLAlchemy ORM for database operations
- Google OAuth verification
- JWT token-based authentication
- File upload/download handling
- Data export to Excel/PDF

### Database Schema

#### Users Table
- id (Primary Key)
- google_id (Unique)
- email
- name
- surname
- employee_id
- contact_no
- role_id (Foreign Key to Roles)
- area_of_responsibility_id (Foreign Key to Areas)
- created_at
- updated_at

#### Roles Table
- id (Primary Key)
- name (Admin, Manager, Employee, Guest)
- permissions (JSON field)
- created_at

#### Areas of Responsibility Table
- id (Primary Key)
- name
- description
- created_at

#### Skills Table
- id (Primary Key)
- name
- description
- created_at

#### Employee Skills Table (Many-to-Many)
- employee_id (Foreign Key to Users)
- skill_id (Foreign Key to Skills)
- proficiency_level
- created_at

#### Shifts Table
- id (Primary Key)
- name
- start_time
- end_time
- hours
- description
- created_at

#### Shift Roster Table
- id (Primary Key)
- employee_id (Foreign Key to Users)
- shift_id (Foreign Key to Shifts)
- date
- hours
- status (pending, approved, rejected)
- approved_by (Foreign Key to Users)
- approved_at
- created_at

#### Timesheets Table
- id (Primary Key)
- employee_id (Foreign Key to Users)
- roster_id (Foreign Key to Shift Roster)
- date
- hours_worked
- status (pending, approved, rejected)
- approved_by (Foreign Key to Users)
- approved_at
- created_at

## Key Features

### Authentication & Authorization
- Google OAuth 2.0 integration
- Role-based access control (Admin, Manager, Employee, Guest)
- JWT token management

### Admin Management
- Employee management (CRUD operations)
- Role management
- Skills management
- Area of responsibility management
- Shift type management

### Shift Scheduling
- Drag-and-drop interface for scheduling
- Color-coded shifts
- Date range picker
- Bulk scheduling operations
- Approval workflow

### Timesheets
- Auto-generation from approved shift rosters
- Manager approval workflow
- Time tracking and reporting

### Analytics Dashboard
- Employee count by shift, role, area
- Target vs actual metrics
- Leave tracking (paid, unpaid, sick)
- Skill-based employee search
- Interactive charts and visualizations

### Export/Import
- Template downloads for all tables
- Bulk data upload via templates
- Excel export for rosters and timesheets
- PDF export for reports

## API Endpoints

### Authentication
- POST /api/auth/google - Google OAuth login
- POST /api/auth/refresh - Refresh JWT token
- POST /api/auth/logout - Logout user

### Users/Employees
- GET /api/employees - List all employees
- POST /api/employees - Create employee
- GET /api/employees/{id} - Get employee details
- PUT /api/employees/{id} - Update employee
- DELETE /api/employees/{id} - Delete employee

### Roles
- GET /api/roles - List all roles
- POST /api/roles - Create role
- PUT /api/roles/{id} - Update role
- DELETE /api/roles/{id} - Delete role

### Areas of Responsibility
- GET /api/areas - List all areas
- POST /api/areas - Create area
- PUT /api/areas/{id} - Update area
- DELETE /api/areas/{id} - Delete area

### Skills
- GET /api/skills - List all skills
- POST /api/skills - Create skill
- PUT /api/skills/{id} - Update skill
- DELETE /api/skills/{id} - Delete skill

### Shifts
- GET /api/shifts - List all shift types
- POST /api/shifts - Create shift type
- PUT /api/shifts/{id} - Update shift type
- DELETE /api/shifts/{id} - Delete shift type

### Shift Roster
- GET /api/roster - Get shift roster (with filters)
- POST /api/roster - Create roster entry
- PUT /api/roster/{id} - Update roster entry
- DELETE /api/roster/{id} - Delete roster entry
- POST /api/roster/{id}/approve - Approve roster entry

### Timesheets
- GET /api/timesheets - Get timesheets (with filters)
- POST /api/timesheets/generate - Generate from approved rosters
- PUT /api/timesheets/{id} - Update timesheet
- POST /api/timesheets/{id}/approve - Approve timesheet

### Analytics
- GET /api/analytics/dashboard - Dashboard metrics
- GET /api/analytics/employees-by-shift - Employee count by shift
- GET /api/analytics/employees-by-role - Employee count by role
- GET /api/analytics/employees-by-area - Employee count by area
- GET /api/analytics/leave-summary - Leave summary

### Export/Import
- GET /api/export/template/{table} - Download template
- POST /api/import/{table} - Upload data
- GET /api/export/roster - Export roster to Excel
- GET /api/export/timesheets - Export timesheets to Excel
- GET /api/export/dashboard - Export dashboard to PDF

## Frontend Pages

### Landing Page
- Dashboard overview
- Quick navigation to main sections
- Key metrics cards

### Shift Roster
- Calendar view with drag-and-drop
- Color-coded shifts
- Filter by date range, employee, role
- Approval status indicators

### Admin Panel
- Employee management
- Role management
- Skills management
- Area management
- Shift type management

### Analytics Dashboard
- Interactive charts
- Employee metrics
- Leave tracking
- Skill-based search

### Timesheets
- Timesheet listing
- Approval workflow
- Export functionality

### Reports
- Various report types
- Export options
- Date range filters

## Technology Stack

### Frontend
- React 18
- Material-UI or Ant Design
- React Router
- Axios for API calls
- Chart.js or Recharts for analytics
- React DnD for drag-and-drop
- Google OAuth library

### Backend
- Flask
- SQLAlchemy
- Flask-JWT-Extended
- Google Auth Library
- Pandas for data processing
- openpyxl for Excel export
- ReportLab for PDF generation

### Database
- SQLite for development
- PostgreSQL for production

## Security Considerations
- Google OAuth for secure authentication
- JWT tokens with expiration
- Role-based access control
- Input validation and sanitization
- CORS configuration
- Rate limiting on API endpoints

