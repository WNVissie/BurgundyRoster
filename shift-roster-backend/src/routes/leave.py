from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required
from src.models.models import db, LeaveRequest, User
from src.utils.decorators import get_current_user, manager_required
from datetime import datetime

leave_bp = Blueprint('leave', __name__)

@leave_bp.route('/', methods=['GET'])
@jwt_required()
def get_leave_requests():
    """
    Get leave requests.
    - Admins/Managers can see all requests.
    - Employees can only see their own requests.
    """
    try:
        current_user = get_current_user()
        query = LeaveRequest.query

        # Filter by role
        if current_user.role_ref.name not in ['Admin', 'Manager']:
            query = query.filter(LeaveRequest.employee_id == current_user.id)

        # Optional filters
        status = request.args.get('status')
        employee_id = request.args.get('employee_id')

        if status:
            query = query.filter(LeaveRequest.status == status)
        if employee_id and current_user.role_ref.name in ['Admin', 'Manager']:
             query = query.filter(LeaveRequest.employee_id == int(employee_id))

        requests = query.order_by(LeaveRequest.start_date.desc()).all()
        return jsonify([r.to_dict() for r in requests]), 200
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@leave_bp.route('/', methods=['POST'])
@jwt_required()
def create_leave_request():
    """Create a new leave request."""
    try:
        current_user = get_current_user()
        data = request.get_json()

        required_fields = ['leave_type', 'start_date', 'end_date', 'reason']
        if not all(field in data for field in required_fields):
            return jsonify({'error': 'Missing required fields'}), 400

        start_date = datetime.strptime(data['start_date'], '%Y-%m-%d').date()
        end_date = datetime.strptime(data['end_date'], '%Y-%m-%d').date()

        if start_date > end_date:
            return jsonify({'error': 'Start date cannot be after end date'}), 400

        days = (end_date - start_date).days + 1

        new_request = LeaveRequest(
            employee_id=current_user.id,
            leave_type=data['leave_type'],
            start_date=start_date,
            end_date=end_date,
            days=days,
            reason=data['reason']
        )
        db.session.add(new_request)
        db.session.commit()

        return jsonify(new_request.to_dict()), 201
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500

@leave_bp.route('/<int:request_id>/action', methods=['POST'])
@jwt_required()
@manager_required
def action_leave_request(request_id):
    """Approve or reject a leave request."""
    try:
        current_user = get_current_user()
        leave_request = LeaveRequest.query.get(request_id)
        if not leave_request:
            return jsonify({'error': 'Leave request not found'}), 404

        data = request.get_json()
        action = data.get('action')

        if action not in ['approve', 'reject']:
            return jsonify({'error': 'Invalid action. Must be "approve" or "reject"'}), 400

        leave_request.status = 'approved' if action == 'approve' else 'rejected'
        leave_request.approved_by = current_user.id
        leave_request.approved_at = datetime.utcnow()

        db.session.commit()

        return jsonify(leave_request.to_dict()), 200
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500

@leave_bp.route('/<int:request_id>', methods=['DELETE'])
@jwt_required()
def delete_leave_request(request_id):
    """Delete a pending leave request."""
    try:
        current_user = get_current_user()
        leave_request = LeaveRequest.query.get(request_id)

        if not leave_request:
            return jsonify({'error': 'Leave request not found'}), 404

        # Check if the user is the owner and the request is still pending
        if leave_request.employee_id != current_user.id:
            return jsonify({'error': 'You can only delete your own leave requests'}), 403

        if leave_request.status != 'pending':
            return jsonify({'error': 'Cannot delete a request that has already been processed'}), 400

        db.session.delete(leave_request)
        db.session.commit()

        return jsonify({'message': 'Leave request deleted successfully'}), 200
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500
