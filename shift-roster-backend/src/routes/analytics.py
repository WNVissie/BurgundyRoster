from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required
from src.models.models import db, User, ShiftRoster, Shift, Role, AreaOfResponsibility, Skill, LeaveRequest, ActivityLog
from src.utils.decorators import get_current_user
from datetime import datetime, date, timedelta
from sqlalchemy import func, and_, or_

analytics_bp = Blueprint('analytics', __name__)

@analytics_bp.route('/dashboard', methods=['GET'])
@jwt_required()
def get_dashboard_metrics():
    """Get main dashboard metrics"""
    try:
        current_user = get_current_user()
        if current_user.role_ref.name not in ['Admin', 'Manager']:
            return jsonify({'error': 'Insufficient permissions'}), 403
        
        # Get date range from query params
        start_date = request.args.get('start_date')
        end_date = request.args.get('end_date')
        
        # Default to current week if no dates provided
        if not start_date or not end_date:
            today = date.today()
            start_date = (today - timedelta(days=today.weekday())).isoformat()
            end_date = (today + timedelta(days=6-today.weekday())).isoformat()
        
        try:
            start_date_obj = datetime.strptime(start_date, '%Y-%m-%d').date()
            end_date_obj = datetime.strptime(end_date, '%Y-%m-%d').date()
        except ValueError:
            return jsonify({'error': 'Invalid date format. Use YYYY-MM-DD'}), 400
        
        # Total employees
        total_employees = User.query.count()
        
        # Employees on shift (for the date range)
        employees_on_shift = db.session.query(func.count(func.distinct(ShiftRoster.employee_id))).filter(
            and_(
                ShiftRoster.date >= start_date_obj,
                ShiftRoster.date <= end_date_obj,
                ShiftRoster.status == 'approved'
            )
        ).scalar()
        
        # Employees on leave
        employees_on_leave = db.session.query(func.count(func.distinct(LeaveRequest.employee_id))).filter(
            and_(
                LeaveRequest.start_date <= end_date_obj,
                LeaveRequest.end_date >= start_date_obj,
                LeaveRequest.status == 'approved'
            )
        ).scalar()
        
        # Available employees (not on shift or leave)
        available_employees = total_employees - employees_on_shift - employees_on_leave
        
        # Pending approvals
        pending_rosters = ShiftRoster.query.filter(
            and_(
                ShiftRoster.date >= start_date_obj,
                ShiftRoster.date <= end_date_obj,
                ShiftRoster.status == 'pending'
            )
        ).count()
        
        # Total scheduled hours
        total_hours = db.session.query(func.sum(ShiftRoster.hours)).filter(
            and_(
                ShiftRoster.date >= start_date_obj,
                ShiftRoster.date <= end_date_obj,
                ShiftRoster.status == 'approved'
            )
        ).scalar() or 0

        # Get recent activities
        recent_activities = ActivityLog.query.order_by(ActivityLog.timestamp.desc()).limit(5).all()
        
        return jsonify({
            'date_range': {
                'start_date': start_date,
                'end_date': end_date
            },
            'metrics': {
                'total_employees': total_employees,
                'employees_on_shift': employees_on_shift,
                'employees_on_leave': employees_on_leave,
                'available_employees': max(0, available_employees),
                'pending_approvals': pending_rosters,
                'total_scheduled_hours': float(total_hours)
            },
            'recent_activity': [activity.to_dict() for activity in recent_activities]
        }), 200
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@analytics_bp.route('/skill-distribution', methods=['GET'])
@jwt_required()
def get_skill_distribution():
    """Get the distribution of skills across all employees"""
    try:
        current_user = get_current_user()
        if current_user.role_ref.name not in ['Admin', 'Manager']:
            return jsonify({'error': 'Insufficient permissions'}), 403

        # Query to count employees for each skill
        skill_counts = db.session.query(
            Skill.name,
            func.count(User.id).label('employee_count')
        ).join(User.skills).group_by(Skill.id, Skill.name).all()

        result = []
        for skill_name, count in skill_counts:
            result.append({
                'skill': skill_name,
                'employees': count
            })

        return jsonify({'data': result}), 200

    except Exception as e:
        return jsonify({'error': str(e)}), 500

@analytics_bp.route('/weekly-approval-trends', methods=['GET'])
@jwt_required()
def get_weekly_approval_trends():
    """Get weekly shift approval trends for the last 12 weeks"""
    try:
        current_user = get_current_user()
        if current_user.role_ref.name not in ['Admin', 'Manager']:
            return jsonify({'error': 'Insufficient permissions'}), 403

        today = date.today()
        # Go back to the beginning of the week (Monday) for the start date
        start_of_period = today - timedelta(days=today.weekday()) - timedelta(weeks=11)

        # Query weekly trends
        # Use func.strftime with '%Y-%W' to group by week number
        # This works for SQLite and PostgreSQL, though syntax can vary for other DBs
        weekly_data = db.session.query(
            func.strftime('%Y-%W', ShiftRoster.date).label('week'),
            ShiftRoster.status,
            func.count(ShiftRoster.id).label('count')
        ).filter(
            ShiftRoster.date >= start_of_period
        ).group_by('week', ShiftRoster.status).order_by('week').all()

        # Process data into a structured format
        trends = {}
        for week_str, status, count in weekly_data:
            if week_str not in trends:
                trends[week_str] = {'week': week_str, 'approved': 0, 'pending': 0, 'rejected': 0}
            if status in trends[week_str]:
                trends[week_str][status] = count

        # Sort by week and convert to list
        sorted_trends = sorted(trends.values(), key=lambda x: x['week'])

        return jsonify({'data': sorted_trends}), 200

    except Exception as e:
        # For debugging, it can be helpful to log the error
        # print(f"Error in get_weekly_approval_trends: {e}")
        return jsonify({'error': str(e)}), 500

@analytics_bp.route('/employees-by-shift', methods=['GET'])
@jwt_required()
def get_employees_by_shift():
    """Get employee count by shift type"""
    try:
        current_user = get_current_user()
        
        if current_user.role_ref.name not in ['Admin', 'Manager']:
            return jsonify({'error': 'Insufficient permissions'}), 403
        
        # Get date range
        start_date = request.args.get('start_date')
        end_date = request.args.get('end_date')
        
        if not start_date or not end_date:
            today = date.today()
            start_date = (today - timedelta(days=today.weekday())).isoformat()
            end_date = (today + timedelta(days=6-today.weekday())).isoformat()
        
        try:
            start_date_obj = datetime.strptime(start_date, '%Y-%m-%d').date()
            end_date_obj = datetime.strptime(end_date, '%Y-%m-%d').date()
        except ValueError:
            return jsonify({'error': 'Invalid date format. Use YYYY-MM-DD'}), 400
        
        # Query employee count by shift
        shift_counts = db.session.query(
            Shift.name,
            Shift.color,
            func.count(func.distinct(ShiftRoster.employee_id)).label('employee_count')
        ).join(ShiftRoster).filter(
            and_(
                ShiftRoster.date >= start_date_obj,
                ShiftRoster.date <= end_date_obj,
                ShiftRoster.status == 'approved'
            )
        ).group_by(Shift.id, Shift.name, Shift.color).all()
        
        result = []
        for shift_name, color, count in shift_counts:
            result.append({
                'shift_name': shift_name,
                'color': color,
                'employee_count': count
            })
        
        return jsonify({
            'date_range': {
                'start_date': start_date,
                'end_date': end_date
            },
            'data': result
        }), 200
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@analytics_bp.route('/employees-by-role', methods=['GET'])
@jwt_required()
def get_employees_by_role():
    """Get employee count by role"""
    try:
        current_user = get_current_user()
        if current_user.role_ref.name not in ['Admin', 'Manager']:
            return jsonify({'error': 'Insufficient permissions'}), 403
        
        # Query employee count by role
        role_counts = db.session.query(
            Role.name,
            func.count(User.id).label('employee_count')
        ).join(User).group_by(Role.id, Role.name).all()
        
        result = []
        for role_name, count in role_counts:
            result.append({
                'role_name': role_name,
                'employee_count': count
            })
        
        return jsonify({'data': result}), 200
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@analytics_bp.route('/employees-by-area', methods=['GET'])
@jwt_required()
def get_employees_by_area():
    """Get employee and shift count by area of responsibility"""
    try:
        current_user = get_current_user()
        if current_user.role_ref.name not in ['Admin', 'Manager']:
            return jsonify({'error': 'Insufficient permissions'}), 403
        
        # Subquery for employee counts per area
        emp_counts_sub = db.session.query(
            User.area_of_responsibility_id,
            func.count(User.id).label('employee_count')
        ).group_by(User.area_of_responsibility_id).subquery()

        # Subquery for shift counts per area
        shift_counts_sub = db.session.query(
            User.area_of_responsibility_id,
            func.count(ShiftRoster.id).label('shift_count')
        ).join(ShiftRoster, User.id == ShiftRoster.employee_id)\
         .group_by(User.area_of_responsibility_id).subquery()

        # Main query joining areas with subqueries
        results = db.session.query(
            AreaOfResponsibility.name,
            func.coalesce(emp_counts_sub.c.employee_count, 0),
            func.coalesce(shift_counts_sub.c.shift_count, 0)
        ).outerjoin(emp_counts_sub, AreaOfResponsibility.id == emp_counts_sub.c.area_of_responsibility_id)\
         .outerjoin(shift_counts_sub, AreaOfResponsibility.id == shift_counts_sub.c.area_of_responsibility_id)\
         .group_by(
            AreaOfResponsibility.name,
            emp_counts_sub.c.employee_count,
            shift_counts_sub.c.shift_count
         ).all()

        result_data = []
        for name, emp_count, shift_count in results:
            result_data.append({
                'name': name,
                'employees': emp_count,
                'shifts': shift_count
            })
        
        return jsonify({'data': result_data}), 200
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@analytics_bp.route('/leave-summary', methods=['GET'])
@jwt_required()
def get_leave_summary():
    """Get leave summary by type"""
    try:
        current_user = get_current_user()
        
        if current_user.role_ref.name not in ['Admin', 'Manager']:
            return jsonify({'error': 'Insufficient permissions'}), 403
        
        # Get date range
        start_date = request.args.get('start_date')
        end_date = request.args.get('end_date')
        
        if not start_date or not end_date:
            today = date.today()
            start_date = today.replace(month=1, day=1).isoformat()  # Start of year
            end_date = today.isoformat()
        
        try:
            start_date_obj = datetime.strptime(start_date, '%Y-%m-%d').date()
            end_date_obj = datetime.strptime(end_date, '%Y-%m-%d').date()
        except ValueError:
            return jsonify({'error': 'Invalid date format. Use YYYY-MM-DD'}), 400
        
        # Query leave summary by type
        leave_summary = db.session.query(
            LeaveRequest.leave_type,
            func.count(LeaveRequest.id).label('request_count'),
            func.sum(LeaveRequest.days).label('total_days')
        ).filter(
            and_(
                LeaveRequest.start_date >= start_date_obj,
                LeaveRequest.end_date <= end_date_obj,
                LeaveRequest.status == 'approved'
            )
        ).group_by(LeaveRequest.leave_type).all()
        
        result = []
        for leave_type, request_count, total_days in leave_summary:
            result.append({
                'leave_type': leave_type,
                'request_count': request_count,
                'total_days': total_days or 0
            })
        
        return jsonify({
            'date_range': {
                'start_date': start_date,
                'end_date': end_date
            },
            'data': result
        }), 200
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@analytics_bp.route('/skill-search', methods=['GET'])
@jwt_required()
def skill_search():
    """Search employees by skill or role"""
    try:
        current_user = get_current_user()
        
        if current_user.role_ref.name not in ['Admin', 'Manager']:
            return jsonify({'error': 'Insufficient permissions'}), 403
        
        skill_name = request.args.get('skill')
        role_name = request.args.get('role')
        
        if not skill_name and not role_name:
            return jsonify({'error': 'Either skill or role parameter is required'}), 400
        
        query = User.query
        
        if skill_name:
            query = query.join(User.skills).filter(Skill.name.ilike(f'%{skill_name}%'))
        
        if role_name:
            query = query.join(Role).filter(Role.name.ilike(f'%{role_name}%'))
        
        employees = query.all()
        
        # Get current shift status for each employee
        today = date.today()
        result = []
        
        for employee in employees:
            # Check if employee has a shift today
            today_roster = ShiftRoster.query.filter(
                and_(
                    ShiftRoster.employee_id == employee.id,
                    ShiftRoster.date == today,
                    ShiftRoster.status == 'approved'
                )
            ).first()
            
            shift_status = 'available'
            if today_roster:
                shift_status = 'on_shift'
            
            # Check if on leave
            on_leave = LeaveRequest.query.filter(
                and_(
                    LeaveRequest.employee_id == employee.id,
                    LeaveRequest.start_date <= today,
                    LeaveRequest.end_date >= today,
                    LeaveRequest.status == 'approved'
                )
            ).first()
            
            if on_leave:
                shift_status = f'on_{on_leave.leave_type}_leave'
            
            employee_data = employee.to_dict()
            employee_data['shift_status'] = shift_status
            employee_data['today_shift'] = today_roster.to_dict() if today_roster else None
            
            result.append(employee_data)
        
        return jsonify({
            'search_criteria': {
                'skill': skill_name,
                'role': role_name
            },
            'employees': result,
            'total': len(result)
        }), 200
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@analytics_bp.route('/shift-coverage', methods=['GET'])
@jwt_required()
def get_shift_coverage():
    """Get shift coverage analysis"""
    try:
        current_user = get_current_user()
        if current_user.role_ref.name not in ['Admin', 'Manager']:
            return jsonify({'error': 'Insufficient permissions'}), 403
        
        # Get date range
        start_date = request.args.get('start_date')
        end_date = request.args.get('end_date')
        
        if not start_date or not end_date:
            today = date.today()
            start_date = (today - timedelta(days=today.weekday())).isoformat()
            end_date = (today + timedelta(days=6-today.weekday())).isoformat()
        
        try:
            start_date_obj = datetime.strptime(start_date, '%Y-%m-%d').date()
            end_date_obj = datetime.strptime(end_date, '%Y-%m-%d').date()
        except ValueError:
            return jsonify({'error': 'Invalid date format. Use YYYY-MM-DD'}), 400
        
        # Get planned (pending+approved) and actual (approved and date <= today) counts per shift type
        today = date.today()
        shift_types = db.session.query(Shift.id, Shift.name, Shift.color).all()
        utilization = []
        for shift_id, shift_name, color in shift_types:
            planned = db.session.query(func.count(ShiftRoster.id)).filter(
                ShiftRoster.shift_id == shift_id,
                ShiftRoster.date >= start_date_obj,
                ShiftRoster.date <= end_date_obj,
                ShiftRoster.status.in_(['pending', 'approved'])
            ).scalar() or 0
            actual = db.session.query(func.count(ShiftRoster.id)).filter(
                ShiftRoster.shift_id == shift_id,
                ShiftRoster.date >= start_date_obj,
                ShiftRoster.date <= end_date_obj,
                ShiftRoster.status == 'approved',
                ShiftRoster.date <= today
            ).scalar() or 0
            utilization.append({
                'shift_name': shift_name,
                'color': color,
                'planned': planned,
                'actual': actual,
                'utilization': int((actual / planned) * 100) if planned > 0 else 0
            })
        return jsonify({
            'date_range': {
                'start_date': start_date,
                'end_date': end_date
            },
            'utilization': utilization
        }), 200
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

