from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required
from src.models.models import db, User, Skill, License, Role, AreaOfResponsibility, Designation, ShiftRoster, LeaveRequest
from src.utils.decorators import manager_required
from sqlalchemy import and_
from datetime import date, datetime

reports_bp = Blueprint('reports', __name__)

@reports_bp.route('/employee-search', methods=['GET'])
@jwt_required()
@manager_required
def employee_search_report():
    """
    Advanced employee search report.
    Filters by: skills, licenses, roles, areas, designations.
    Also shows current shift status.
    """
    try:
        skill_ids = request.args.getlist('skill_ids', type=int)
        license_ids = request.args.getlist('license_ids', type=int)
        role_ids = request.args.getlist('role_ids', type=int)
        area_ids = request.args.getlist('area_ids', type=int)
        designation_ids = request.args.getlist('designation_ids', type=int)

        query = User.query

        if skill_ids:
            query = query.join(User.skills).filter(Skill.id.in_(skill_ids))

        if license_ids:
            query = query.join(User.licenses_assoc).filter(License.id.in_(license_ids))

        if role_ids:
            query = query.filter(User.role_id.in_(role_ids))

        if area_ids:
            query = query.filter(User.area_of_responsibility_id.in_(area_ids))

        if designation_ids:
            query = query.filter(User.designation_id.in_(designation_ids))

        employees = query.distinct().all()

        today = date.today()
        results = []

        for employee in employees:
            status = 'Available'

            on_shift = ShiftRoster.query.filter(
                and_(
                    ShiftRoster.employee_id == employee.id,
                    ShiftRoster.date == today,
                    ShiftRoster.status == 'approved'
                )
            ).first()
            if on_shift:
                status = 'On Shift'

            on_leave = LeaveRequest.query.filter(
                and_(
                    LeaveRequest.employee_id == employee.id,
                    LeaveRequest.start_date <= today,
                    LeaveRequest.end_date >= today,
                    LeaveRequest.status == 'approved'
                )
            ).first()
            if on_leave:
                status = f"On Leave ({on_leave.leave_type})"

            emp_dict = employee.to_dict()
            emp_dict['current_status'] = status
            results.append(emp_dict)

        return jsonify(results), 200

    except Exception as e:
        return jsonify({'error': str(e)}), 500

@reports_bp.route('/employee-history/<int:employee_id>', methods=['GET'])
@jwt_required()
@manager_required
def employee_history_report(employee_id):
    """
    Get booking history for a single employee.
    """
    try:
        employee = User.query.get(employee_id)
        if not employee:
            return jsonify({'error': 'Employee not found'}), 404

        history = ShiftRoster.query.filter_by(employee_id=employee_id).order_by(ShiftRoster.date.desc()).all()

        from sqlalchemy import func
        shift_type_counts = db.session.query(ShiftRoster.shift.name, func.count(ShiftRoster.id)).join(ShiftRoster.shift).filter(ShiftRoster.employee_id == employee_id).group_by(ShiftRoster.shift.name).all()

        return jsonify({
            'employee_details': employee.to_dict(),
            'shift_history': [entry.to_dict() for entry in history],
            'summary': {
                'total_shifts': len(history),
                'shift_type_summary': [{'type': name, 'count': count} for name, count in shift_type_counts],
            }
        }), 200

    except Exception as e:
        return jsonify({'error': str(e)}), 500

@reports_bp.route('/shift-acceptance', methods=['GET'])
@jwt_required()
@manager_required
def shift_acceptance_report():
    """
    Report on employees who have accepted or not yet accepted their shifts.
    """
    try:
        start_date_str = request.args.get('start_date')
        end_date_str = request.args.get('end_date')

        query = ShiftRoster.query.filter(
            ShiftRoster.status.in_(['approved', 'accepted'])
        )

        if start_date_str:
            start_date = datetime.strptime(start_date_str, '%Y-%m-%d').date()
            query = query.filter(ShiftRoster.date >= start_date)
        if end_date_str:
            end_date = datetime.strptime(end_date_str, '%Y-%m-%d').date()
            query = query.filter(ShiftRoster.date <= end_date)

        roster_entries = query.order_by(ShiftRoster.date, ShiftRoster.employee_id).all()

        return jsonify([entry.to_dict() for entry in roster_entries]), 200

    except Exception as e:
        return jsonify({'error': str(e)}), 500
