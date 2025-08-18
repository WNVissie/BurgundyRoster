import os
import sys
sys.path.insert(0, os.path.dirname(os.path.dirname(__file__)))

from flask import Flask
from src.models.models import db, Role, AreaOfResponsibility, Skill, License, EmployeeLicense, User, Shift, ShiftRoster, Timesheet, Designation
from src.config import config
from datetime import datetime, date, time
import json

def create_app():
    app = Flask(__name__)
    app.config.from_object(config['development'])
    db.init_app(app)
    return app

def init_database():
    app = create_app()
    
    with app.app_context():
        db.drop_all()
        db.create_all()
        
        roles_data = [
            {'name': 'Admin', 'permissions': json.dumps({'manage_employees': True, 'manage_roles': True, 'manage_shifts': True, 'manage_areas': True, 'manage_skills': True, 'view_all_rosters': True, 'approve_rosters': True, 'approve_timesheets': True, 'view_analytics': True, 'export_data': True})},
            {'name': 'Manager', 'permissions': json.dumps({'view_team_rosters': True, 'approve_rosters': True, 'approve_timesheets': True, 'view_analytics': True, 'export_data': True})},
            {'name': 'Employee', 'permissions': json.dumps({'view_own_roster': True, 'view_own_timesheet': True})},
            {'name': 'Guest', 'permissions': json.dumps({'view_public_info': True})}
        ]
        for role_data in roles_data:
            db.session.add(Role(**role_data))
        
        areas_data = [
            {'name': 'Front Desk', 'description': 'Customer service and reception'},
            {'name': 'Kitchen', 'description': 'Food preparation and cooking'},
            {'name': 'Housekeeping', 'description': 'Cleaning and maintenance'}
        ]
        for area_data in areas_data:
            db.session.add(AreaOfResponsibility(**area_data))

        skills_data = [
            {'name': 'Customer Service', 'description': 'Excellent customer interaction skills'},
            {'name': 'Cooking', 'description': 'Food preparation and culinary skills'},
            {'name': 'Cleaning', 'description': 'Professional cleaning techniques'}
        ]
        for skill_data in skills_data:
            db.session.add(Skill(**skill_data))

        licenses_data = [
            {'name': 'First Aid', 'description': 'Certified first aid license'},
            {'name': 'Forklift', 'description': 'Forklift operator license'}
        ]
        for lic_data in licenses_data:
            db.session.add(License(**lic_data))
        
        designations_data = [
            {'designation_name': 'Barista'},
            {'designation_name': 'Shift Supervisor'},
            {'designation_name': 'Store Manager'}
        ]
        for des_data in designations_data:
            db.session.add(Designation(**des_data))

        shifts_data = [
            {'name': 'Morning Shift', 'start_time': time(6, 0), 'end_time': time(14, 0), 'hours': 8.0, 'description': 'Early morning shift', 'color': '#3498db'},
            {'name': 'Afternoon Shift', 'start_time': time(14, 0), 'end_time': time(22, 0), 'hours': 8.0, 'description': 'Afternoon to evening shift', 'color': '#e74c3c'},
            {'name': 'Night Shift', 'start_time': time(22, 0), 'end_time': time(6, 0), 'hours': 8.0, 'description': 'Overnight shift', 'color': '#9b59b6'},
            {'name': 'On Leave', 'start_time': time(0, 0), 'end_time': time(0, 0), 'hours': 0.0, 'description': 'Employee is on approved leave', 'color': '#7f8c8d'}
        ]
        for shift_data in shifts_data:
            db.session.add(Shift(**shift_data))
        
        db.session.commit()
        
        admin_role = Role.query.filter_by(name='Admin').first()
        manager_role = Role.query.filter_by(name='Manager').first()
        employee_role = Role.query.filter_by(name='Employee').first()
        
        front_desk_area = AreaOfResponsibility.query.filter_by(name='Front Desk').first()
        kitchen_area = AreaOfResponsibility.query.filter_by(name='Kitchen').first()
        
        users_data = [
            {'google_id': 'admin123', 'email': 'admin@company.com', 'name': 'John', 'surname': 'Admin', 'employee_id': 'EMP001', 'contact_no': '+1234567890', 'role_id': admin_role.id, 'area_of_responsibility_id': front_desk_area.id},
            {'google_id': 'manager123', 'email': 'manager@company.com', 'name': 'Jane', 'surname': 'Manager', 'employee_id': 'EMP002', 'contact_no': '+1234567891', 'role_id': manager_role.id, 'area_of_responsibility_id': kitchen_area.id},
            {'google_id': 'employee123', 'email': 'employee1@company.com', 'name': 'Bob', 'surname': 'Employee', 'employee_id': 'EMP003', 'contact_no': '+1234567892', 'role_id': employee_role.id, 'area_of_responsibility_id': front_desk_area.id}
        ]
        
        for user_data in users_data:
            db.session.add(User(**user_data))
        
        db.session.commit()
        
        print("Database initialized successfully with sample data!")

if __name__ == '__main__':
    init_database()
