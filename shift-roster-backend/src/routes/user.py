from flask import Blueprint, jsonify, request
from src.models.models import User, db

user_bp = Blueprint('user', __name__)

@user_bp.route('/users', methods=['GET'])
def get_users():
    users = User.query.all()
    return jsonify([user.to_dict() for user in users])

@user_bp.route('/users', methods=['POST'])
def create_user():
    data = request.json
    user = User(
        username=data['username'],
        email=data['email'],
        designation_id=data.get('designation_id') if data.get('designation_id') not in ('', None) else None,
        role_id=data.get('role_id') if data.get('role_id') not in ('', None) else None,
        area_of_responsibility_id=data.get('area_of_responsibility_id') if data.get('area_of_responsibility_id') not in ('', None) else None
    )
    db.session.add(user)
    db.session.commit()
    return jsonify(user.to_dict()), 201

@user_bp.route('/users/<int:user_id>', methods=['GET'])
def get_user(user_id):
    user = User.query.get_or_404(user_id)
    return jsonify(user.to_dict())

@user_bp.route('/users/<int:user_id>', methods=['PUT'])
def update_user(user_id):
    user = User.query.get_or_404(user_id)
    data = request.json
    user.username = data.get('username', user.username)
    user.email = data.get('email', user.email)
    # Only update if a valid value is sent
    if 'designation_id' in data and data.get('designation_id') not in ('', None):
        user.designation_id = data.get('designation_id')
    if 'role_id' in data and data.get('role_id') not in ('', None):
        user.role_id = data.get('role_id')
    if 'area_of_responsibility_id' in data and data.get('area_of_responsibility_id') not in ('', None):
        user.area_of_responsibility_id = data.get('area_of_responsibility_id')
    db.session.commit()
    return jsonify(user.to_dict())

@user_bp.route('/users/<int:user_id>', methods=['DELETE'])
def delete_user(user_id):
    user = User.query.get_or_404(user_id)
    db.session.delete(user)
    db.session.commit()
    return '', 204
