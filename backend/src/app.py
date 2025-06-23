"""
Main Flask application for Twilight Helper Backend
"""

import logging
import os
import signal
import sys

from flask import Flask
from flask_cors import CORS

# Import our modular components
from .api.config_routes import config_bp
from .api.game_routes import game_bp

# Set up file logging only if DEBUG=1
DEBUG = os.environ.get("DEBUG", "0") == "1"

if DEBUG:
    # Create logs directory in the project root if it doesn't exist
    logs_dir = os.path.join(os.path.dirname(os.path.dirname(os.path.dirname(__file__))), 'logs')
    os.makedirs(logs_dir, exist_ok=True)

    log_file = os.path.join(logs_dir, 'twilight-helper-backend.log')
    logging.basicConfig(
        level=logging.INFO,
        format='%(asctime)s - %(levelname)s - %(message)s',
        handlers=[
            logging.FileHandler(log_file),
            logging.StreamHandler(sys.stdout)
        ]
    )
    logger = logging.getLogger(__name__)
    logger.info(f"Logging to file: {log_file}")
    logger.info("Flask application initialized")
else:
    logging.basicConfig(level=logging.CRITICAL)  # Effectively disables logging
    logger = logging.getLogger(__name__)

def create_app() -> Flask:
    """Create and configure the Flask application"""
    app = Flask(__name__)

    # Configure CORS
    CORS(app, supports_credentials=True, resources={
        r"/api/*": {
            "origins": ["http://localhost:3000"],
            "methods": ["GET", "POST", "OPTIONS", "PUT"],
            "allow_headers": ["Content-Type"],
            "expose_headers": ["Access-Control-Allow-Origin"],
            "supports_credentials": True
        }
    })

    # Register blueprints
    app.register_blueprint(config_bp)
    app.register_blueprint(game_bp)

    return app

def signal_handler(signum: int, frame: object) -> None:
    """Handle shutdown signals gracefully"""
    logger.info(f"Received signal {signum} to shut down")
    print("Shutting down server...", flush=True)
    sys.exit(0)

# Create the application instance
app = create_app()

if __name__ == '__main__':
    # Set up signal handlers for graceful shutdown (important for Windows/Electron)
    signal.signal(signal.SIGINT, signal_handler)
    signal.signal(signal.SIGTERM, signal_handler)

    # Simple Flask startup with auto-reloader
    app.run(host='0.0.0.0', port=5001, debug=True)
