from flask_sqlalchemy import SQLAlchemy
from src.models.models import db

db = SQLAlchemy()

class User(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    username = db.Column(db.String(80), unique=True, nullable=False)
    email = db.Column(db.String(120), unique=True, nullable=False)
    designation_id = db.Column(db.Integer, db.ForeignKey('designation.designation_id'))  # <-- Add this line
    role_id = db.Column(db.Integer, db.ForeignKey('role.role_id'))  # <-- Add this line
    area_of_responsibility_id = db.Column(db.Integer, db.ForeignKey('area.area_id'))  # <-- Add this line

    def __repr__(self):
        return f'<User {self.username}>'

    def to_dict(self):
        return {
            'id': self.id,
            'username': self.username,
            'email': self.email,
            'designation_id': self.designation_id,  # <-- Add this line
            'role_id': self.role_id,  # <-- Add this line
            'area_of_responsibility_id': self.area_of_responsibility_id  # <-- Add this line
        }
