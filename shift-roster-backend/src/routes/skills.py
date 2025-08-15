from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required
from src.models import db, Skill

skills_bp = Blueprint('skills', __name__, url_prefix='/api/skills')

@skills_bp.route('/', methods=['GET'])
@jwt_required()
def get_skills():
    skills = Skill.query.all()
    skills_list = [
        {
            'id': skill.id,
            'name': skill.name,
            'description': skill.description
        }
        for skill in skills
    ]
    return jsonify({'skills': skills_list})

# Example: Add more skill-related endpoints