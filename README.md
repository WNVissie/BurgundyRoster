# Employee Shift Roster Management System

A comprehensive web application for managing employee shifts, schedules, and workforce analytics with role-based access control and Google OAuth authentication.

## 🚀 Features

### Core Functionality
- **Employee Management**: Complete CRUD operations for employee data with roles, areas, and skills
- **Shift Scheduling**: Drag-and-drop interface for creating and managing shift rosters
- **Role-Based Access**: Admin, Manager, and Employee roles with appropriate permissions
- **Google OAuth**: Secure authentication with Google sign-in integration
- **Analytics Dashboard**: Interactive charts and metrics for workforce insights
- **Export/Import**: CSV, Excel, and PDF export capabilities with bulk import functionality

### Advanced Features
- **Drag-and-Drop Scheduling**: Intuitive shift assignment with visual feedback
- **Approval Workflows**: Manager approval system for shift assignments
- **Timesheet Management**: Automated timesheet generation from shift rosters
- **Skills Management**: Track employee skills and competencies
- **Leave Management**: Handle various types of leave requests
- **Responsive Design**: Mobile-friendly interface for all devices

## 🏗️ Architecture

### Frontend (React)
- **Framework**: React 19 with Vite build tool
- **UI Library**: Tailwind CSS with shadcn/ui components
- **Charts**: Recharts for data visualization
- **Drag & Drop**: react-dnd for interactive scheduling
- **State Management**: React Context API
- **Authentication**: JWT token-based authentication

### Backend (Flask)
- **Framework**: Flask with SQLAlchemy ORM
- **Database**: SQLite (development) / PostgreSQL (production)
- **Authentication**: Flask-JWT-Extended with Google OAuth
- **File Processing**: pandas, openpyxl for data import/export
- **PDF Generation**: ReportLab for report generation
- **API**: RESTful API with comprehensive endpoints

## 📋 Prerequisites

- **Node.js**: Version 18 or higher
- **Python**: Version 3.8 or higher
- **Git**: For version control
- **Modern Web Browser**: Chrome, Firefox, Safari, or Edge

## 🛠️ Installation

### 1. Clone the Repository
```bash
git clone <repository-url>
cd employee-shift-roster
```

### 2. Backend Setup
```bash
cd shift-roster-backend

# Create virtual environment
python -m venv venv

# Activate virtual environment
# On Windows:
venv\Scripts\activate
# On macOS/Linux:
source venv/bin/activate

# Install dependencies
pip install -r requirements.txt

# Initialize database
python src/init_db.py

# Start the backend server
python src/main.py
```

The backend will be available at `http://localhost:5001`

### 3. Frontend Setup
```bash
cd shift-roster-frontend

# Install dependencies
npm install
# or
pnpm install

# Start development server
npm run dev
# or
pnpm run dev
```

The frontend will be available at `http://localhost:5173`

## 🔧 Configuration

### Environment Variables

Create a `.env` file in the backend directory:

```env
# Flask Configuration
FLASK_ENV=development
SECRET_KEY=your-secret-key-here
JWT_SECRET_KEY=your-jwt-secret-key

# Database Configuration
DATABASE_URL=sqlite:///shift_roster.db

# Google OAuth (Optional for development)
GOOGLE_CLIENT_ID=your-google-client-id
GOOGLE_CLIENT_SECRET=your-google-client-secret

# CORS Configuration
CORS_ORIGINS=http://localhost:5173,http://localhost:3000
```

### Database Configuration

The application uses SQLite by default for development. For production, configure PostgreSQL:

```env
DATABASE_URL=postgresql://username:password@localhost/shift_roster_db
```

## 🚀 Deployment

### Frontend Deployment (Netlify/Vercel)

1. **Build the frontend**:
```bash
cd shift-roster-frontend
npm run build
```

2. **Deploy the `dist` folder** to your hosting platform:
   - **Netlify**: Drag and drop the `dist` folder
   - **Vercel**: Connect your Git repository
   - **GitHub Pages**: Use the built files

### Backend Deployment (Heroku/Render)

1. **Prepare for deployment**:
```bash
cd shift-roster-backend
pip freeze > requirements.txt
```

2. **Create Procfile**:
```
web: python src/main.py
```

3. **Deploy to platform**:
   - **Heroku**: `git push heroku main`
   - **Render**: Connect your Git repository
   - **Railway**: Connect your Git repository

### Docker Deployment

1. **Build and run with Docker Compose**:
```bash
docker-compose up --build
```

## 👥 Default User Accounts

The application comes with pre-configured demo accounts:

| Role | Email | Password | Access Level |
|------|-------|----------|--------------|
| Admin | admin@company.com | admin123 | Full system access |
| Manager | manager@company.com | manager123 | Employee and shift management |
| Employee | employee@company.com | employee123 | View own schedules |

## 📚 API Documentation

### Authentication Endpoints
- `POST /api/auth/login` - User login
- `POST /api/auth/refresh` - Refresh JWT token
- `POST /api/auth/logout` - User logout

### Employee Management
- `GET /api/employees` - List all employees
- `POST /api/employees` - Create new employee
- `PUT /api/employees/{id}` - Update employee
- `DELETE /api/employees/{id}` - Delete employee

### Shift Management
- `GET /api/roster` - Get shift roster
- `POST /api/roster` - Create shift assignment
- `PUT /api/roster/{id}` - Update shift assignment
- `DELETE /api/roster/{id}` - Delete shift assignment

### Analytics
- `GET /api/analytics/dashboard` - Get dashboard metrics
- `GET /api/analytics/employees` - Employee analytics
- `GET /api/analytics/shifts` - Shift analytics

### Export/Import
- `GET /api/export/employees/csv` - Export employees to CSV
- `GET /api/export/roster/excel` - Export roster to Excel
- `POST /api/import/employees/csv` - Import employees from CSV

## 🎯 Usage Guide

### For Administrators
1. **Employee Management**: Add, edit, and manage employee records
2. **System Configuration**: Manage roles, areas, skills, and shift types
3. **Data Management**: Import/export data and generate reports
4. **User Access**: Control user permissions and access levels

### For Managers
1. **Shift Scheduling**: Create and assign shifts using drag-and-drop interface
2. **Approval Workflows**: Approve or reject shift assignments and timesheets
3. **Team Analytics**: View team performance and utilization metrics
4. **Report Generation**: Export shift rosters and timesheet reports

### For Employees
1. **View Schedules**: Check assigned shifts and upcoming schedules
2. **Request Changes**: Submit shift change requests (if enabled)
3. **View Timesheets**: Review work hours and timesheet status
4. **Profile Management**: Update personal information and skills

## 🔍 Troubleshooting

### Common Issues

**Backend not starting:**
- Check if Python virtual environment is activated
- Verify all dependencies are installed: `pip install -r requirements.txt`
- Check database connection and permissions

**Frontend build errors:**
- Clear node modules: `rm -rf node_modules && npm install`
- Check Node.js version compatibility
- Verify all dependencies are installed

**Authentication issues:**
- Check JWT secret key configuration
- Verify CORS settings for frontend-backend communication
- Ensure Google OAuth credentials are correctly configured

**Database errors:**
- Run database initialization: `python src/init_db.py`
- Check database file permissions
- Verify database URL configuration

### Performance Optimization

**Frontend:**
- Enable code splitting for large bundles
- Implement lazy loading for routes
- Optimize image assets and bundle size

**Backend:**
- Add database indexing for frequently queried fields
- Implement caching for analytics queries
- Use connection pooling for production databases

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b feature-name`
3. Make your changes and commit: `git commit -m 'Add feature'`
4. Push to the branch: `git push origin feature-name`
5. Submit a pull request

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 🆘 Support

For support and questions:
- Create an issue in the GitHub repository
- Check the troubleshooting guide above
- Review the API documentation for integration help

## 🔄 Version History

- **v1.0.0** - Initial release with core functionality
  - Employee management system
  - Shift scheduling with drag-and-drop
  - Role-based access control
  - Analytics dashboard
  - Export/import capabilities

---

**Built with ❤️ using React, Flask, and modern web technologies**

