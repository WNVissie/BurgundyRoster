import csv
import os
import json
from src.models.models import db, User, Role, AreaOfResponsibility, Skill, License, EmployeeLicense, Shift
from src.main import create_app
from sqlalchemy.exc import IntegrityError
from datetime import time

# CSV file paths (adjust if needed): try ENV var then a few common fallbacks
def resolve_csv_dir():
    env_dir = os.environ.get('CSV_DIR')
    if env_dir and os.path.isdir(env_dir):
        return env_dir
    here = os.path.dirname(__file__)
    candidates = [
        os.path.join(here, 'Re_ Employee Shift Roster'),
        os.path.join(os.path.dirname(here), 'Re_ Employee Shift Roster'),
        os.path.join(here, 'Re-Employee Shft Roster'),
        os.path.join(os.path.dirname(here), 'Re-Employee Shft Roster'),
        os.path.join(here, 'data', 'Re_ Employee Shift Roster'),
        os.path.join(here, 'data', 'Re-Employee Shft Roster'),
        os.path.join(here, 'data'),
        here,
    ]
    for d in candidates:
        if os.path.isdir(d):
            return d
    return here

def first_existing(base_dir, names):
    for n in names:
        p = os.path.join(base_dir, n)
        if os.path.isfile(p):
            return p
    return os.path.join(base_dir, names[0])

CSV_DIR = resolve_csv_dir()
EMPLOYEES_CSV = first_existing(CSV_DIR, ['employees.csv', 'employees_template.csv'])
SKILLS_CSV = first_existing(CSV_DIR, ['skills.csv', 'skills_template.csv'])
AREAS_CSV = first_existing(CSV_DIR, ['areas.csv', 'areas_template.csv'])
LICENSES_CSV = first_existing(CSV_DIR, ['licenses.csv'])

ADMIN_EMAIL = 'wanda.nezar@gmail.com'

app = create_app()

# Helper to clear all data
def clear_tables():
    db.session.query(EmployeeLicense).delete()
    db.session.query(User).delete()
    db.session.query(Role).delete()
    db.session.query(AreaOfResponsibility).delete()
    db.session.query(Skill).delete()
    db.session.query(License).delete()
    db.session.query(Shift).delete()
    db.session.commit()

# Seed Roles
ROLES = [
    {
        'name': 'Admin',
        'permissions': {
            'manage_employees': True,
            'manage_roles': True,
            'manage_areas': True,
            'manage_skills': True,
            'manage_shifts': True,
            'view_analytics': True
        }
    },
    {
        'name': 'Manager',
        'permissions': {
            'manage_employees': True,
            'manage_shifts': True,
            'view_analytics': True
        }
    },
    {
        'name': 'Employee',
        'permissions': {
            'view_analytics': False
        }
    }
]

def seed_roles():
    for role in ROLES:
        db.session.add(Role(name=role['name'], permissions=json.dumps(role['permissions'])))
    db.session.commit()

def seed_default_data():
    """Seeds the database with default data instead of CSV files."""
    # Seed Areas
    print("Seeding default areas...")
    areas = [
        AreaOfResponsibility(name='Front of House', description='Customer-facing area', color='#3498db'),
        AreaOfResponsibility(name='Back of House', description='Kitchen and prep area', color='#2ecc71')
    ]
    db.session.bulk_save_objects(areas)
    db.session.commit()

    # Seed Skills
    print("Seeding default skills...")
    skills = [
        Skill(name='Cashier', description='Handles payments'),
        Skill(name='Cook', description='Prepares food'),
        Skill(name='Barista', description='Prepares coffee and other drinks')
    ]
    db.session.bulk_save_objects(skills)
    db.session.commit()

    # Seed Shifts
    print("Seeding default shifts...")
    shifts = [
        Shift(name='Morning Shift', start_time=time(8, 0), end_time=time(16, 0), hours=8.0, color='#f1c40f'),
        Shift(name='Evening Shift', start_time=time(16, 0), end_time=time(0, 0), hours=8.0, color='#34495e'),
        Shift(name='Night Shift', start_time=time(0, 0), end_time=time(8, 0), hours=8.0, color='#9b59b6')
    ]
    db.session.bulk_save_objects(shifts)
    db.session.commit()

    # Seed Employees
    print("Seeding default employees...")
    roles = {r.name: r for r in Role.query.all()}
    default_area = AreaOfResponsibility.query.first()

    employees = [
        User(
            google_id='dev-admin',
            email=ADMIN_EMAIL,
            name='Wanda',
            surname='Nezar',
            employee_id='E001',
            contact_no='111-222-3333',
            role_id=roles['Admin'].id,
            area_of_responsibility_id=default_area.id if default_area else None
        ),
        User(
            google_id='dev-employee',
            email='john.doe@example.com',
            name='John',
            surname='Doe',
            employee_id='E002',
            contact_no='444-555-6666',
            role_id=roles['Employee'].id,
            area_of_responsibility_id=default_area.id if default_area else None
        )
    ]
    db.session.bulk_save_objects(employees)
    db.session.commit()


def main():
    with app.app_context():
        print('--- Seeding Database with Default Data ---')
        print('Clearing tables...')
        clear_tables()
        print('Seeding roles...')
        seed_roles()
        seed_default_data()
        print('Done.')

if __name__ == '__main__':
    main()
