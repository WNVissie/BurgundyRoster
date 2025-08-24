from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required
from src.models.models import db, LeaveRequest, User, Shift, ShiftRoster
from src.utils.decorators import get_current_user, manager_required
from datetime import datetime, timedelta

leave_bp = Blueprint('leave', __name__)

@leave_bp.route('', methods=['GET'])
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

@leave_bp.route('', methods=['POST'])
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
        
        # Calculate remaining days when leave is created
        # Get all authorised leave for this employee
        authorised_leaves = LeaveRequest.query.filter_by(
            employee_id=current_user.id, 
            status='authorised'
        ).all()
        
        total_used_days = sum(float(leave.days) for leave in authorised_leaves)
        annual_leave_allocation = float(current_user.total_no_leave_days_annual or 0)
        
        # Calculate what would remain if this leave is approved
        remaining_days = annual_leave_allocation - total_used_days - days

        new_request = LeaveRequest(
            employee_id=current_user.id,
            leave_type=data['leave_type'],
            start_date=start_date,
            end_date=end_date,
            days=days,
            reason=data['reason'],
            no_of_leave_days_remaining=remaining_days  # Store what would remain if approved
        )
        db.session.add(new_request)
        db.session.commit()

        return jsonify(new_request.to_dict()), 201
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500

@leave_bp.route('/<int:request_id>/approve', methods=['POST'])
@jwt_required()
@manager_required
def approve_leave_request(request_id):
    """Supervisor approves a leave request (first stage)."""
    try:
        current_user = get_current_user()
        leave_request = LeaveRequest.query.get(request_id)
        if not leave_request:
            return jsonify({'error': 'Leave request not found'}), 404

        if leave_request.status != 'pending':
            return jsonify({'error': 'Leave request is not in pending status'}), 400

        data = request.get_json()
        action = data.get('action')  # 'approve' or 'reject'

        if action not in ['approve', 'reject']:
            return jsonify({'error': 'Invalid action. Must be "approve" or "reject"'}), 400

        # Get the employee who made the leave request
        employee = User.query.get(leave_request.employee_id)
        
        # Update approval fields (first stage)
        leave_request.status = 'approved' if action == 'approve' else 'rejected'
        leave_request.approved_by = current_user.id
        leave_request.approved_at = datetime.utcnow()
        leave_request.action_comment = data.get('action_comment', '')

        # If rejected at approval stage, calculate current remaining days (no deduction)
        if action == 'reject':
            current_remaining = (float(employee.total_no_leave_days_annual or 0) - 
                               sum(float(leave.days) for leave in 
                                   LeaveRequest.query.filter_by(employee_id=employee.id, status='authorised').all()))
            leave_request.no_of_leave_days_remaining = current_remaining

        # Don't calculate leave days for approvals yet - that happens at authorization stage
        
        db.session.commit()
        return jsonify(leave_request.to_dict()), 200
        
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500

@leave_bp.route('/<int:request_id>/authorise', methods=['POST'])
@jwt_required()
@manager_required
def authorise_leave_request(request_id):
    """HR/Manager authorises an approved leave request (second stage)."""
    try:
        current_user = get_current_user()
        leave_request = LeaveRequest.query.get(request_id)
        if not leave_request:
            return jsonify({'error': 'Leave request not found'}), 404

        if leave_request.status != 'approved':
            return jsonify({'error': 'Leave request must be approved first'}), 400

        data = request.get_json()
        action = data.get('action')  # 'authorise' or 'reject'

        if action not in ['authorise', 'reject']:
            return jsonify({'error': 'Invalid action. Must be "authorise" or "reject"'}), 400

        # Get the employee who made the leave request
        employee = User.query.get(leave_request.employee_id)
        
        # Update authorization fields (second stage)
        if action == 'authorise':
            leave_request.status = 'authorised'
            leave_request.authorised_by = current_user.id
            leave_request.authorised_at = datetime.utcnow()
            
            # NOW calculate and update remaining leave days (only on authorization)
            authorised_leaves = LeaveRequest.query.filter_by(
                employee_id=employee.id, 
                status='authorised'
            ).all()
            
            total_used_days = sum(float(leave.days) for leave in authorised_leaves) + float(leave_request.days)
            annual_allocation = float(employee.total_no_leave_days_annual or 0)
            remaining_days = annual_allocation - total_used_days
            
            # Update both the leave request and user records
            leave_request.no_of_leave_days_remaining = remaining_days
            employee.total_no_leave_days_annual_float = remaining_days
            
            # Find the "On Leave" shift and create roster entries
            leave_shift = Shift.query.filter_by(name='On Leave').first()
            if leave_shift:
                current_date = leave_request.start_date
                while current_date <= leave_request.end_date:
                    # Check if a shift already exists for this employee on this day
                    existing_roster = ShiftRoster.query.filter_by(
                        employee_id=leave_request.employee_id,
                        date=current_date
                    ).first()

                    if not existing_roster:
                        new_roster_entry = ShiftRoster(
                            employee_id=leave_request.employee_id,
                            shift_id=leave_shift.id,
                            date=current_date,
                            hours=0,
                            status='approved'
                        )
                        db.session.add(new_roster_entry)

                    current_date += timedelta(days=1)
        else:
            # Rejected at authorization stage - revert to pending or rejected
            leave_request.status = 'rejected'
            leave_request.authorised_by = current_user.id
            leave_request.authorised_at = datetime.utcnow()
            
            # No change to remaining days since it was never deducted
            current_remaining = (float(employee.total_no_leave_days_annual or 0) - 
                               sum(float(leave.days) for leave in 
                                   LeaveRequest.query.filter_by(employee_id=employee.id, status='authorised').all()))
            leave_request.no_of_leave_days_remaining = current_remaining

        # Add authorization comment if provided
        auth_comment = data.get('action_comment', '')
        if auth_comment:
            existing_comment = leave_request.action_comment or ''
            leave_request.action_comment = f"{existing_comment}\nAuth: {auth_comment}" if existing_comment else f"Auth: {auth_comment}"

        db.session.commit()
        return jsonify(leave_request.to_dict()), 200
        
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500

# Keep the old endpoint for backward compatibility (deprecated)
@leave_bp.route('/<int:request_id>/action', methods=['POST'])
@jwt_required()
@manager_required
def action_leave_request(request_id):
    """Legacy endpoint - redirects to approve endpoint."""
    return approve_leave_request(request_id)

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

