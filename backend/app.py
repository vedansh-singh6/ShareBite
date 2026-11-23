"""ShareBite Flask API — application factory.

Run:
    cd backend
    python -m venv .venv && .venv\\Scripts\\activate   (Windows)
    pip install -r requirements.txt
    copy .env.example .env   (then edit DATABASE_URL / secrets)
    python seed.py           (creates tables + demo data)
    python app.py            (serves on http://127.0.0.1:5000)

Point the frontend at this API by setting VITE_API_MODE=flask.
"""
from flask import Flask, jsonify
from config import Config
from extensions import db, cors


def create_app(config_class=Config):
    app = Flask(__name__)
    app.config.from_object(config_class)

    db.init_app(app)
    cors.init_app(app, resources={r"/api/*": {"origins": app.config["CORS_ORIGINS"]}})

    from routes_auth import bp as auth_bp
    from routes_donations import bp as donations_bp
    from routes_tasks import bp as tasks_bp
    from routes_users import bp as users_bp
    from routes_notifications import bp as notifications_bp
    from routes_ngos import bp as ngos_bp

    app.register_blueprint(auth_bp)
    app.register_blueprint(donations_bp)
    app.register_blueprint(tasks_bp)
    app.register_blueprint(users_bp)
    app.register_blueprint(notifications_bp)
    app.register_blueprint(ngos_bp)

    @app.get("/api/health")
    def health():
        return jsonify({"status": "ok", "service": "sharebite-api"})

    @app.errorhandler(404)
    def not_found(_):
        return jsonify({"error": "Endpoint not found."}), 404

    @app.errorhandler(500)
    def server_error(_):
        return jsonify({"error": "Internal server error."}), 500

    with app.app_context():
        import models  # noqa: F401  (register models)

    return app


app = create_app()

if __name__ == "__main__":
    app.run(host="127.0.0.1", port=5000, debug=True)