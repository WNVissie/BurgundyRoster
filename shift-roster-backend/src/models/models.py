from flask_sqlalchemy import SQLAlchemy
from datetime import datetime
import json
from datetime import date as date_cls, timedelta

db = SQLAlchemy()

# Designation table for employee designations
class Designation(db.Model):
    __tablename__ = 'designations'
    designation_id = db.Column(db.Integer, primary_key=True)
    designation_name = db.Column(db.String(100), unique=True, nullable=False)
    created_on = db.Column(db.DateTime, default=datetime.utcnow)
    users = db.relationship('User', backref='designation_ref', lazy=True)
    
    def __repr__(self):
        return f'<Designation {self.designation_name}>'
    
    def to_dict(self):
        return {
            'designation_id': self.designation_id,
            'designation_name': self.designation_name,
            'created_on': self.created_on.isoformat() if self.created_on else None
        }

# Association table for many-to-many relationship between employees and skills
employee_skills = db.Table('employee_skills',
    db.Column('employee_id', db.Integer, db.ForeignKey('users.id'), primary_key=True),
    db.Column('skill_id', db.Integer, db.ForeignKey('skills.id'), primary_key=True),
    db.Column('proficiency_level', db.String(20), default='Beginner'),
    db.Column('created_at', db.DateTime, default=datetime.utcnow)
)

class Role(db.Model):
    __tablename__ = 'roles'
    
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(50), unique=True, nullable=False)
    permissions = db.Column(db.Text)  # JSON string for permissions
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    
    # Relationships
    users = db.relationship('User', backref='role_ref', lazy=True)
    
    def __repr__(self):
        return f'<Role {self.name}>'
    
    def to_dict(self):
        # permissions can be stored as JSON string (expected) or dict (legacy). Normalize to dict.
        perms = {}
        try:
            if isinstance(self.permissions, str):
                perms = json.loads(self.permissions) if self.permissions else {}
            elif isinstance(self.permissions, dict):
                perms = self.permissions
        except Exception:
            perms = {}
        return {
            'id': self.id,
            'name': self.name,
            'permissions': perms,
            'created_at': self.created_at.isoformat() if self.created_at else None
        }

class AreaOfResponsibility(db.Model):
    __tablename__ = 'areas_of_responsibility'
    
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(100), unique=True, nullable=False)
    description = db.Column(db.Text)
    color = db.Column(db.String(7), default='#808080') # Default grey color
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    
    # Relationships
    users = db.relationship('User', backref='area_ref', lazy=True)
    
    def __repr__(self):
        return f'<AreaOfResponsibility {self.name}>'
    
    def to_dict(self):
        return {
            'id': self.id,
            'name': self.name,
            'description': self.description,
            'color': self.color,
            'created_at': self.created_at.isoformat() if self.created_at else None
        }

class Skill(db.Model):
    __tablename__ = 'skills'
    
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(100), unique=True, nullable=False)
    description = db.Column(db.Text)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    
    def __repr__(self):
        return f'<Skill {self.name}>'
    
    def to_dict(self):
        return {
            'id': self.id,
            'name': self.name,
            'description': self.description,
            'created_at': self.created_at.isoformat() if self.created_at else None
        }

class License(db.Model):
    __tablename__ = 'licenses'

    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(100), unique=True, nullable=False)
    description = db.Column(db.Text)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

    def __repr__(self):
        return f'<License {self.name}>'

    def to_dict(self):
        return {
            'id': self.id,
            'name': self.name,
            'description': self.description,
            'created_at': self.created_at.isoformat() if self.created_at else None
        }

class EmployeeLicense(db.Model):
    __tablename__ = 'employee_licenses'

    id = db.Column(db.Integer, primary_key=True)
    employee_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False)
    license_id = db.Column(db.Integer, db.ForeignKey('licenses.id'), nullable=False)
    expiry_date = db.Column(db.Date, nullable=True)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

    # Relationships
    license = db.relationship('License', backref='employee_assoc', lazy=True)

class User(db.Model):
    __tablename__ = 'users'
    
    id = db.Column(db.Integer, primary_key=True)
    google_id = db.Column(db.String(100), unique=True, nullable=False)
    email = db.Column(db.String(120), unique=True, nullable=False)
    name = db.Column(db.String(100), nullable=False)
    surname = db.Column(db.String(100), nullable=False)
    employee_id = db.Column(db.String(50), unique=True, nullable=True)
    contact_no = db.Column(db.String(20), nullable=False, default='')
    alt_contact_name = db.Column(db.String(100))
    alt_contact_no = db.Column(db.String(20))
    designation_id = db.Column(db.Integer, db.ForeignKey('designations.designation_id'))
    role_id = db.Column(db.Integer, db.ForeignKey('roles.id'), nullable=False)
    area_of_responsibility_id = db.Column(db.Integer, db.ForeignKey('areas_of_responsibility.id'))
    rate_type = db.Column(db.String(50), name='rate_type')
    rate_value = db.Column(db.Numeric(10, 2), name='rate_-value')
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Relationships
    skills = db.relationship('Skill', secondary=employee_skills, lazy='subquery',
                           backref=db.backref('employees', lazy=True))
    shift_rosters = db.relationship('ShiftRoster', foreign_keys='ShiftRoster.employee_id', backref='employee', lazy=True)
    timesheets = db.relationship('Timesheet', foreign_keys='Timesheet.employee_id', backref='employee', lazy=True)
    approved_rosters = db.relationship('ShiftRoster', foreign_keys='ShiftRoster.approved_by', backref='approver', lazy=True)
    approved_timesheets = db.relationship('Timesheet', foreign_keys='Timesheet.approved_by', backref='timesheet_approver', lazy=True)
    licenses_assoc = db.relationship('EmployeeLicense', backref='employee', lazy=True, cascade='all, delete-orphan')
    
    def __repr__(self):
        return f'<User {self.name} {self.surname}>'
    
    def to_dict(self):
        licenses_detailed = []
        today = date_cls.today()
        for assoc in self.licenses_assoc or []:
            exp = assoc.expiry_date
            days_to_expiry = (exp - today).days if exp else None
            licenses_detailed.append({
                'license': assoc.license.to_dict() if assoc.license else None,
                'license_id': assoc.license_id,
                'expiry_date': exp.isoformat() if exp else None,
                'days_to_expiry': days_to_expiry,
                'expired': days_to_expiry is not None and days_to_expiry < 0,
                'expiring_soon': days_to_expiry is not None and days_to_expiry <= 30
            })

        return {
            'id': self.id,
            'google_id': self.google_id,
            'email': self.email,
            'name': self.name,
            'surname': self.surname,
            'employee_id': self.employee_id,
            'contact_no': self.contact_no,
            'alt_contact_name': self.alt_contact_name,
            'alt_contact_no': self.alt_contact_no,
            'licenses_detailed': licenses_detailed,
            'designation': self.designation_ref.designation_name if self.designation_ref else None,
            'role_id': self.role_id,
            'role': self.role_ref.to_dict() if self.role_ref else None,
            'area_of_responsibility_id': self.area_of_responsibility_id,
            'area_of_responsibility': self.area_ref.to_dict() if self.area_ref else None,
            'rate_type': self.rate_type,
            'rate_value': float(self.rate_value) if self.rate_value is not None else None,
            'skills': [skill.to_dict() for skill in self.skills],
            'created_at': self.created_at.isoformat() if self.created_at else None,
            'updated_at': self.updated_at.isoformat() if self.updated_at else None
        }

class Shift(db.Model):
    __tablename__ = 'shifts'
    
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(100), unique=True, nullable=False)
    start_time = db.Column(db.Time, nullable=False)
    end_time = db.Column(db.Time, nullable=False)
    hours = db.Column(db.Float, nullable=False)
    description = db.Column(db.Text)
    color = db.Column(db.String(7), default='#3498db')  # Hex color for UI
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    
    # Relationships
    shift_rosters = db.relationship('ShiftRoster', backref='shift', lazy=True)
    
    def __repr__(self):
        return f'<Shift {self.name}>'
    
    def to_dict(self):
        return {
            'id': self.id,
            'name': self.name,
            'start_time': self.start_time.strftime('%H:%M') if self.start_time else None,
            'end_time': self.end_time.strftime('%H:%M') if self.end_time else None,
            'hours': self.hours,
            'description': self.description,
            'color': self.color,
            'created_at': self.created_at.isoformat() if self.created_at else None
        }

class ShiftRoster(db.Model):
    __tablename__ = 'shift_roster'
    
    id = db.Column(db.Integer, primary_key=True)
    employee_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False)
    shift_id = db.Column(db.Integer, db.ForeignKey('shifts.id'), nullable=False)
    area_of_responsibility_id = db.Column(db.Integer, db.ForeignKey('areas_of_responsibility.id'), nullable=True)
    date = db.Column(db.Date, nullable=False)
    hours = db.Column(db.Float, nullable=False)
    status = db.Column(db.String(20), default='pending')  # pending, approved, rejected, accepted
    approved_by = db.Column(db.Integer, db.ForeignKey('users.id'))
    approved_at = db.Column(db.DateTime)
    accepted_at = db.Column(db.DateTime, nullable=True)
    notes = db.Column(db.Text)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    
    # Relationships
    timesheets = db.relationship('Timesheet', backref='roster', lazy=True)
    area = db.relationship('AreaOfResponsibility', backref='shift_rosters', lazy=True)
    
    def __repr__(self):
        return f'<ShiftRoster {self.employee.name} - {self.shift.name} - {self.date}>'
    
    def to_dict(self):
        return {
            'id': self.id,
            'employee_id': self.employee_id,
            'employee': {
                'id': self.employee.id,
                'name': self.employee.name,
                'surname': self.employee.surname,
                'employee_id': self.employee.employee_id,
                'role': self.employee.role_ref.name if self.employee.role_ref else None,
                'area': self.employee.area_ref.name if self.employee.area_ref else None
            } if self.employee else None,
            'shift_id': self.shift_id,
            'shift': self.shift.to_dict() if self.shift else None,
            'area_of_responsibility_id': self.area_of_responsibility_id,
            'area': self.area.to_dict() if self.area else None,
            'date': self.date.isoformat() if self.date else None,
            'hours': self.hours,
            'status': self.status,
            'approved_by': self.approved_by,
            'approver': {
                'id': self.approver.id,
                'name': self.approver.name,
                'surname': self.approver.surname
            } if self.approver else None,
            'approved_at': self.approved_at.isoformat() if self.approved_at else None,
            'accepted_at': self.accepted_at.isoformat() if self.accepted_at else None,
            'notes': self.notes,
            'created_at': self.created_at.isoformat() if self.created_at else None,
            'timesheet': self.timesheets[0].to_dict() if self.timesheets else None
        }

class Timesheet(db.Model):
    __tablename__ = 'timesheets'
    
    id = db.Column(db.Integer, primary_key=True)
    employee_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False)
    roster_id = db.Column(db.Integer, db.ForeignKey('shift_roster.id'), nullable=False)
    date = db.Column(db.Date, nullable=False)
    hours_worked = db.Column(db.Float, nullable=False)
    status = db.Column(db.String(20), default='pending')  # pending, approved, rejected
    approved_by = db.Column(db.Integer, db.ForeignKey('users.id'))
    approved_at = db.Column(db.DateTime)
    accepted_at = db.Column(db.DateTime, nullable=True)
    notes = db.Column(db.Text)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    
    def __repr__(self):
        return f'<Timesheet {self.employee.name} - {self.date}>'
    
    def to_dict(self):
        return {
            'id': self.id,
            'employee_id': self.employee_id,
            'employee': {
                'id': self.employee.id,
                'name': self.employee.name,
                'surname': self.employee.surname,
                'employee_id': self.employee.employee_id
            } if self.employee else None,
            'roster_id': self.roster_id,
            'date': self.date.isoformat() if self.date else None,
            'hours_worked': self.hours_worked,
            'status': self.status,
            'approved_by': self.approved_by,
            'approver': {
                'id': self.timesheet_approver.id,
                'name': self.timesheet_approver.name,
                'surname': self.timesheet_approver.surname
            } if self.timesheet_approver else None,
            'approved_at': self.approved_at.isoformat() if self.approved_at else None,
            'notes': self.notes,
            'created_at': self.created_at.isoformat() if self.created_at else None,
            'accepted_at': self.accepted_at.isoformat() if self.accepted_at else None
        }

class LeaveRequest(db.Model):
    __tablename__ = 'leave_requests'

    id = db.Column(db.Integer, primary_key=True)
    employee_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False)
    leave_type = db.Column(db.String(20), nullable=False)  # paid, unpaid, sick
    start_date = db.Column(db.Date, nullable=False)
    end_date = db.Column(db.Date, nullable=False)
    days = db.Column(db.Integer, nullable=False)
    reason = db.Column(db.Text)
    status = db.Column(db.String(20), default='pending')  # pending, approved, rejected
    approved_by = db.Column(db.Integer, db.ForeignKey('users.id'))
    approved_at = db.Column(db.DateTime)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    action_comment = db.Column(db.String(255))  # <-- Add this line

    # Relationships
    employee = db.relationship('User', foreign_keys=[employee_id], backref='leave_requests')
    approver = db.relationship('User', foreign_keys=[approved_by], backref='approved_leaves')

    def __repr__(self):
        return f'<LeaveRequest {self.employee.name} - {self.leave_type} - {self.start_date}>'
    
    def to_dict(self):
        return {
            'id': self.id,
            'employee_id': self.employee_id,
            'employee': {
                'id': self.employee.id,
                'name': self.employee.name,
                'surname': self.employee.surname,
                'employee_id': self.employee.employee_id
            } if self.employee else None,
            'leave_type': self.leave_type,
            'start_date': self.start_date.isoformat() if self.start_date else None,
            'end_date': self.end_date.isoformat() if self.end_date else None,
            'days': self.days,
            'reason': self.reason,
            'status': self.status,
            'approved_by': self.approved_by,
            'approver': {
                'id': self.approver.id,
                'name': self.approver.name,
                'surname': self.approver.surname
            } if self.approver else None,
            'approved_at': self.approved_at.isoformat() if self.approved_at else None,
            'created_at': self.created_at.isoformat() if self.created_at else None,
            'action_comment': self.action_comment
        }

class ActivityLog(db.Model):
    __tablename__ = 'activity_logs'

    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False)
    action = db.Column(db.String(100), nullable=False)
    details = db.Column(db.Text, nullable=True)
    timestamp = db.Column(db.DateTime, default=datetime.utcnow)

    user = db.relationship('User', backref='activities')

    def to_dict(self):
        return {
            'id': self.id,
            'user': self.user.name + ' ' + self.user.surname if self.user else 'Unknown User',
            'action': self.action,
            'details': self.details,
            'timestamp': self.timestamp.isoformat()
        }

class CommunityPost(db.Model):
    __tablename__ = 'community_posts'
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False)
    post_type = db.Column(db.String(50), default='Question') # 'Question' or 'Announcement'
    title = db.Column(db.String(200), nullable=False)
    content = db.Column(db.Text, nullable=False)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

    author = db.relationship('User', backref='community_posts')
    replies = db.relationship('PostReply', backref='post', lazy='dynamic', cascade='all, delete-orphan')

    def to_dict(self):
        return {
            'id': self.id,
            'author': self.author.to_dict() if self.author else None,
            'post_type': self.post_type,
            'title': self.title,
            'content': self.content,
            'created_at': self.created_at.isoformat(),
            'reply_count': self.replies.count()
        }

class PostReply(db.Model):
    __tablename__ = 'post_replies'
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False)
    post_id = db.Column(db.Integer, db.ForeignKey('community_posts.id'), nullable=False)
    content = db.Column(db.Text, nullable=False)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

    author = db.relationship('User', backref='post_replies')

    def to_dict(self):
        return {
            'id': self.id,
            'author': self.author.to_dict() if self.author else None,
            'post_id': self.post_id,
            'content': self.content,
            'created_at': self.created_at.isoformat()
        }
