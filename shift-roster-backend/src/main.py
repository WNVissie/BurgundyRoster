import os
import sys
from dotenv import load_dotenv
# DON'T CHANGE THIS !!!
sys.path.insert(0, os.path.dirname(os.path.dirname(__file__)))

from flask import Flask, send_from_directory
from flask_cors import CORS
from flask_jwt_extended import JWTManager
from src.models.models import db
from src.routes.user import user_bp
from src.config import config

def create_app():
    # Load env vars from .env if present (dev convenience)
    load_dotenv()
    app = Flask(__name__, static_folder=os.path.join(os.path.dirname(__file__), 'static'))
    
    # Load configuration
    app.config.from_object(config['development'])
    
    # Initialize extensions
    db.init_app(app)
    jwt = JWTManager(app)

    # JWT error handlers to normalize responses
    @jwt.unauthorized_loader
    def handle_unauthorized(err_str):
        return {"error": "Unauthorized", "message": err_str}, 401

    @jwt.invalid_token_loader
    def handle_invalid_token(err_str):
        return {"error": "Invalid token", "message": err_str}, 401

    @jwt.expired_token_loader
    def handle_expired_token(jwt_header, jwt_payload):
        return {"error": "Token expired", "message": "Please refresh your session."}, 401

    @jwt.needs_fresh_token_loader
    def handle_needs_fresh(jwt_header, jwt_payload):
        return {"error": "Fresh token required", "message": "Please login again."}, 401

    @jwt.revoked_token_loader
    def handle_revoked(jwt_header, jwt_payload):
        return {"error": "Token revoked", "message": "Please login again."}, 401
    
    # Normalize JWT errors to 401 so the frontend can refresh or logout gracefully
    @jwt.invalid_token_loader
    def invalid_token_callback(reason):
        from flask import jsonify
        return jsonify({'error': f'Invalid token: {reason}'}), 401

    @jwt.unauthorized_loader
    def unauthorized_callback(reason):
        from flask import jsonify
        return jsonify({'error': f'Unauthorized: {reason}'}), 401

    @jwt.expired_token_loader
    def expired_token_callback(jwt_header, jwt_payload):
        from flask import jsonify
        return jsonify({'error': 'Token has expired'}), 401

    @jwt.revoked_token_loader
    def revoked_token_callback(jwt_header, jwt_payload):
        from flask import jsonify
        return jsonify({'error': 'Token has been revoked'}), 401

    @jwt.needs_fresh_token_loader
    def needs_fresh_token_callback(jwt_header, jwt_payload):
        from flask import jsonify
        return jsonify({'error': 'Fresh token required'}), 401
    
    # Configure CORS
    CORS(app, origins=app.config['CORS_ORIGINS'], supports_credentials=True)
    
    # Register blueprints
    app.register_blueprint(user_bp, url_prefix='/api')
    
    # Import and register new blueprints
    from src.routes.auth import auth_bp
    from src.routes.employees import employees_bp
    from src.routes.roster import roster_bp
    from src.routes.admin import admin_bp
    from src.routes.analytics import analytics_bp
    from src.routes.export import export_bp
    from src.routes.timesheets import timesheets_bp

    # Register blueprints
    app.register_blueprint(auth_bp, url_prefix='/api/auth')
    app.register_blueprint(employees_bp, url_prefix='/api/employees')
    app.register_blueprint(roster_bp, url_prefix='/api/roster')
    app.register_blueprint(admin_bp, url_prefix='/api')
    app.register_blueprint(analytics_bp, url_prefix='/api/analytics')
    app.register_blueprint(export_bp, url_prefix='/api/export')
    app.register_blueprint(timesheets_bp, url_prefix='/api/timesheets')

    # Create database tables and apply lightweight migrations
    with app.app_context():
        db.create_all()
        # Lightweight migration for new columns/tables when using SQLite
        try:
            from sqlalchemy import text
            from sqlalchemy.exc import OperationalError
            with db.engine.connect() as conn:
                cols = conn.execute(text("PRAGMA table_info(users)")).fetchall()
                col_names = {c[1] for c in cols}
                alter_stmts = []
                if 'alt_contact_name' not in col_names:
                    alter_stmts.append("ALTER TABLE users ADD COLUMN alt_contact_name VARCHAR(100)")
                if 'alt_contact_no' not in col_names:
                    alter_stmts.append("ALTER TABLE users ADD COLUMN alt_contact_no VARCHAR(20)")
                # ...existing code...
                for stmt in alter_stmts:
                    try:
                        conn.execute(text(stmt))
                    except OperationalError:
                        pass

                # Ensure licenses table exists
                conn.execute(text("CREATE TABLE IF NOT EXISTS licenses (id INTEGER PRIMARY KEY, name VARCHAR(100) UNIQUE NOT NULL, description TEXT, created_at DATETIME)"))
                # Ensure employee_licenses table exists
                conn.execute(text("CREATE TABLE IF NOT EXISTS employee_licenses (id INTEGER PRIMARY KEY, employee_id INTEGER NOT NULL, license_id INTEGER NOT NULL, expiry_date DATE, created_at DATETIME, FOREIGN KEY(employee_id) REFERENCES users(id), FOREIGN KEY(license_id) REFERENCES licenses(id))"))
        except Exception:
            # Best-effort; ignore if migration check fails
            pass
    
    @app.route('/', defaults={'path': ''})
    @app.route('/<path:path>')
    def serve(path):
        static_folder_path = app.static_folder
        if static_folder_path is None:
            return "Static folder not configured", 404

        if path != "" and os.path.exists(os.path.join(static_folder_path, path)):
            return send_from_directory(static_folder_path, path)
        else:
            index_path = os.path.join(static_folder_path, 'index.html')
            if os.path.exists(index_path):
                return send_from_directory(static_folder_path, 'index.html')
            else:
                return "index.html not found", 404
    
    @app.route('/ping')
    def ping():
        return 'pong'
    
    return app

app = create_app()

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5001, debug=True)

