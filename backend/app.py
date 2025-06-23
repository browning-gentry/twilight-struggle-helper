import json
import logging
import os
import signal
import sys
from dataclasses import dataclass
from os.path import expanduser
from pathlib import Path
from typing import Any, Union, Tuple, Dict, List, Optional

from flask import Flask, jsonify, request, Response
from flask_cors import CORS
from twilight_log_parser import log_parser

# Set up file logging only if DEBUG=1
DEBUG = os.environ.get("DEBUG", "0") == "1"

if DEBUG:
    # Create logs directory in the project root if it doesn't exist
    logs_dir = os.path.join(os.path.dirname(os.path.dirname(__file__)), 'logs')
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


app = Flask(__name__)
CORS(app, supports_credentials=True, resources={
    r"/api/*": {
        "origins": ["http://localhost:3000"],
        "methods": ["GET", "POST", "OPTIONS", "PUT"],
        "allow_headers": ["Content-Type"],
        "expose_headers": ["Access-Control-Allow-Origin"],
        "supports_credentials": True
    }
})

# Get the app data directory
if sys.platform.startswith('win'):
    app_data_dir = os.path.join(os.environ.get('APPDATA', ''), 'Twilight Struggle Helper')
else:
    app_data_dir = os.path.join(expanduser('~'), 'Library', 'Application Support', 'Twilight Struggle Helper')

os.makedirs(app_data_dir, exist_ok=True)
CONFIG_FILE = os.path.join(app_data_dir, 'config.json')

def get_default_log_directory() -> str:
    """Get the default log directory based on platform"""
    if sys.platform.startswith('win'):
        # Use a more robust method to get Documents folder on Windows
        # This is equivalent to C# Environment.SpecialFolder.Personal
        try:
            import winreg
            with winreg.OpenKey(winreg.HKEY_CURRENT_USER,
                               r"Software\Microsoft\Windows\CurrentVersion\Explorer\Shell Folders") as key:
                documents = winreg.QueryValueEx(key, "Personal")[0]
        except (ImportError, FileNotFoundError, OSError):
            # Fallback to USERPROFILE\Documents if registry method fails
            documents = os.path.join(os.environ.get('USERPROFILE', ''), 'Documents')

        return str(Path(documents) / 'Twilight Struggle')

    # For macOS and Linux, use Desktop instead of Documents
    return str(Path(expanduser('~')) / 'Desktop' / 'Twilight Struggle')

def load_config() -> dict[str, Any]:
    """Load configuration from file"""
    default_config = {
        "log_file_path": None,  # None means use default directory
        "log_directory": get_default_log_directory()
    }

    try:
        if os.path.exists(CONFIG_FILE):
            with open(CONFIG_FILE) as f:
                config = json.load(f)
                # Merge with defaults to ensure all keys exist
                default_config.update(config)
                return default_config
    except Exception as e:
        logger.error(f"Error loading config: {e}")

    return default_config

def save_config(config: dict[str, Any]) -> bool:
    """Save configuration to file"""
    try:
        with open(CONFIG_FILE, 'w') as f:
            json.dump(config, f, indent=2)
        return True
    except Exception as e:
        logger.error(f"Error saving config: {e}")
        return False

def get_latest_log_file() -> str | None:
    try:
        config = load_config()
        logger.info(f"Loaded config: {config}")

        # If a specific log file is configured, use it
        if config.get("log_file_path"):
            logger.info(f"Specific log file configured: {config['log_file_path']}")
            # Construct full path if it's just a filename
            if os.path.isabs(config["log_file_path"]):
                # It's already a full path
                log_file_path: str = config["log_file_path"]
            else:
                # It's a relative filename, combine with log directory
                log_dir = Path(config.get("log_directory", get_default_log_directory()))
                log_file_path = str(log_dir / config["log_file_path"])

            logger.info(f"Constructed full path: {log_file_path}")
            if os.path.exists(log_file_path):
                logger.info(f"Using configured log file: {log_file_path}")
                return log_file_path
            else:
                logger.error(f"Configured log file not found: {log_file_path}")
                return None  # Don't fall back, return None immediately
        else:
            logger.info("No specific log file configured, using most recent")

        # Otherwise, use the configured directory or default
        log_dir = Path(config.get("log_directory", get_default_log_directory()))
        logger.info(f"Looking for log files in: {log_dir}")

        if not log_dir.exists():
            logger.error(f"Log directory not found at {log_dir}")
            return None

        # Get all .txt files in the directory
        log_files = list(log_dir.glob('*.txt'))

        if not log_files:
            logger.error("No .txt files found in log directory")
            return None

        # Sort by modification time and get the most recent
        latest_log = max(log_files, key=lambda x: x.stat().st_mtime)
        logger.info(f"Found latest log file: {latest_log}")
        return str(latest_log)
    except Exception as e:
        logger.error(f"Error finding log file: {str(e)}", exc_info=True)
        return None

def get_log_directory_info() -> dict[str, Any]:
    """Get information about the log directory and available log files"""
    config = load_config()
    log_dir = Path(config.get("log_directory", get_default_log_directory()))

    result = {
        "log_dir_exists": log_dir.exists(),
        "log_dir_path": str(log_dir),
        "platform": sys.platform,
        "userprofile": os.environ.get('USERPROFILE', 'Not set'),
        "documents_path": get_default_log_directory(),
        "config_file_path": CONFIG_FILE,
        "current_config": config
    }

    if log_dir.exists():
        log_files = list(log_dir.glob('*.txt'))
        result["log_files_found"] = len(log_files)
        result["log_files"] = [str(f) for f in log_files]
    else:
        result["log_files_found"] = 0
        result["log_files"] = []

    return result

@app.route('/api/config/', methods=['GET'])
def get_config() -> Union[Response, Tuple[Response, int]]:
    """Get current configuration"""
    try:
        config = load_config()
        return jsonify({"success": True, "config": config})
    except Exception as e:
        logger.error(f"Error getting config: {e}")
        return jsonify({"success": False, "error": str(e)}), 500

@app.route('/api/config/', methods=['PUT'])
def update_config() -> Union[Response, Tuple[Response, int]]:
    """Update configuration"""
    try:
        if not request.is_json:
            return jsonify({"success": False, "error": "Content-Type must be application/json"}), 415
        try:
            data = request.get_json(force=True)
        except Exception:
            return jsonify({"success": False, "error": "Malformed JSON"}), 400

        # Empty dict is valid - it means no updates
        if data is None:
            return jsonify({"success": False, "error": "No data provided"}), 400

        config = load_config()

        # Update config with provided data
        if "log_file_path" in data:
            config["log_file_path"] = data["log_file_path"]
        if "log_directory" in data:
            config["log_directory"] = data["log_directory"]

        # Save the updated config
        if save_config(config):
            return jsonify({"success": True, "config": config})
        else:
            return jsonify({"success": False, "error": "Failed to save configuration"}), 500

    except Exception as e:
        logger.error(f"Error updating config: {e}")
        return jsonify({"success": False, "error": str(e)}), 500

@app.route('/api/config/reset', methods=['POST'])
def reset_config() -> Union[Response, Tuple[Response, int]]:
    """Reset configuration to defaults"""
    try:
        default_config = {
            "log_file_path": None,
            "log_directory": get_default_log_directory()
        }

        if save_config(default_config):
            return jsonify({"success": True, "config": default_config})
        else:
            return jsonify({"success": False, "error": "Failed to save configuration"}), 500

    except Exception as e:
        logger.error(f"Error resetting config: {e}")
        return jsonify({"success": False, "error": str(e)}), 500

@app.route('/api/test', methods=['GET'])
def test_endpoint() -> Union[Response, Tuple[Response, int]]:
    """Test endpoint to debug issues"""
    try:
        config = load_config()
        log_dir = Path(config.get("log_directory", get_default_log_directory()))

        result = {
            "log_dir_exists": log_dir.exists(),
            "log_dir_path": str(log_dir),
            "platform": sys.platform,
            "userprofile": os.environ.get('USERPROFILE', 'Not set'),
            "documents_path": get_default_log_directory(),
            "config_file_path": CONFIG_FILE,
            "current_config": config
        }

        if log_dir.exists():
            log_files = list(log_dir.glob('*.txt'))
            result["log_files_found"] = len(log_files)
            result["log_files"] = [str(f) for f in log_files]
        else:
            result["log_files_found"] = 0
            result["log_files"] = []

        return jsonify(result)
    except Exception as e:
        return jsonify({"error": str(e), "traceback": str(e.__traceback__)}), 500

@app.route('/api/current-status', methods=['GET'])
def get_current_status() -> Union[Response, Tuple[Response, int]]:
    logger.debug('Received request for current status')
    try:
        config = load_config()
        filepath = get_latest_log_file()

        # If a specific file is configured but doesn't exist, return error with that filename
        if config.get("log_file_path") and not filepath:
            configured_filename = os.path.basename(config["log_file_path"])
            return jsonify({
                "error": f"Configured log file not found: {configured_filename}",
                "filename": configured_filename,
                "deck": [],
                "discarded": [],
                "removed": [],
                "cards_in_hands": [],
                "your_hand": [],
                "opponent_hand": []
            })

        if not filepath:
            logger.error('No log files found')
            return jsonify({
                "error": "No log files found in Twilight Struggle directory",
                "filename": None,
                "deck": [],
                "discarded": [],
                "removed": [],
                "cards_in_hands": [],
                "your_hand": [],
                "opponent_hand": []
            })

        # Extract just the filename from the full path
        filename = os.path.basename(filepath)

        parser = log_parser.LogParser()
        game = parser.parse_game_log(filepath)
        if not game:
            return jsonify({
                "status": "no game data",
                "filename": filename,
                "deck": [],
                "discarded": [],
                "removed": [],
                "cards_in_hands": [],
                "your_hand": [],
                "opponent_hand": []
            })

        # Show current state
        play_data = format_play_data(game.current_play, game)
        return jsonify({
            "status": "ok",
            "filename": filename,
            **play_data
        })
    except Exception as e:
        logger.error(f"Error in get_current_status: {str(e)}", exc_info=True)
        return jsonify({
            "error": str(e),
            "filename": None,
            "deck": [],
            "discarded": [],
            "removed": [],
            "cards_in_hands": [],
            "your_hand": [],
            "opponent_hand": []
        }), 500

@app.route('/api/shutdown', methods=['POST'])
def shutdown() -> Union[Response, Tuple[Response, int]]:
    """Shutdown the server gracefully"""
    try:
        # This will only work if running with Werkzeug
        func = request.environ.get('werkzeug.server.shutdown')
        if func is None:
            raise RuntimeError('Not running with the Werkzeug Server')
        func()
        return jsonify({"status": "shutting down"})
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@app.route('/api/status', methods=['GET'])
def status() -> Response:
    return jsonify({"status": "ok"})

@dataclass
class CardData:
    name: str
    side: str
    ops: int

def format_play_data(play: Any, game: Any) -> Dict[str, Any]:
    """Format play data to match frontend expectations"""
    def format_card(card_name: str) -> Dict[str, Any]:
        if not hasattr(game, 'CARDS'):
            return {"name": card_name, "side": "unknown", "ops": 0}
        card = game.CARDS.get(card_name)
        if not card:
            logger.warning(f"Card not found in CARDS: {card_name}")
            return {"name": card_name, "side": "unknown", "ops": 0}

        # Get ops value, defaulting to 0 if None or not present
        ops = 0
        if hasattr(card, 'ops'):
            ops = card.ops if card.ops is not None else 0

        # Log card details for debugging
        logger.debug(f"Formatting card: {card.name} (side: {card.side}, ops: {ops})")

        # Return structured card data
        return {
            "name": card.name,
            "side": card.side,
            "ops": ops
        }

    return {
        "turn": play.turn if hasattr(play, 'turn') else None,
        "deck": [format_card(card) for card in play.possible_draw_cards],
        "discarded": [format_card(card) for card in play.discarded_cards],
        "removed": [format_card(card) for card in play.removed_cards],
        "cards_in_hands": [format_card(card) for card in play.cards_in_hands],
        "your_hand": [],
        "opponent_hand": []
    }

def signal_handler(signum: int, frame: Any) -> None:
    """Handle shutdown signals gracefully"""
    logger.info(f"Received signal {signum} to shut down")
    print("Shutting down server...", flush=True)
    sys.exit(0)

if __name__ == '__main__':
    # Set up signal handlers for graceful shutdown (important for Windows/Electron)
    signal.signal(signal.SIGINT, signal_handler)
    signal.signal(signal.SIGTERM, signal_handler)

    # Start Flask on port 8000 with debug mode disabled
    app.run(host='0.0.0.0', port=8000, debug=False)
