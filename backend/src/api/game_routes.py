"""
Game-related API routes for Twilight Helper Backend
"""

import logging
import os
from typing import Any

from flask import Blueprint, Response, jsonify, request, current_app
from twilight_log_parser import log_parser
from werkzeug.exceptions import BadRequest, UnsupportedMediaType

from ..models.game_data import ConfigModel, GameDataFormatter
from ..utils.log_utils import get_latest_log_file

logger = logging.getLogger(__name__)

# Create blueprint for game routes
game_bp = Blueprint("game", __name__, url_prefix="/api")


@game_bp.errorhandler(BadRequest)
def handle_bad_request(e: BadRequest) -> tuple[Response, int]:
    return jsonify({"error": str(e)}), 400


@game_bp.errorhandler(UnsupportedMediaType)
def handle_unsupported_media_type(e: UnsupportedMediaType) -> tuple[Response, int]:
    return jsonify({"error": str(e)}), 415


@game_bp.errorhandler(404)
def handle_not_found(e: Exception) -> tuple[Response, int]:
    return jsonify({"error": "Not found"}), 404


@game_bp.route("/test", methods=["GET"])
def test_endpoint(*args: Any, **kwargs: Any) -> Response | tuple[Response, int]:
    """Test endpoint to debug issues"""
    try:
        config_manager = current_app.config['CONFIG_MANAGER']
        config: ConfigModel = config_manager.load_config()
        log_dir = config_manager.get_default_log_directory()
        result: dict[str, Any] = {
            "log_dir_exists": os.path.exists(log_dir),
            "log_dir_path": log_dir,
            "platform": os.name,
            "userprofile": os.environ.get("USERPROFILE", "Not set"),
            "documents_path": config_manager.get_default_log_directory(),
            "config_file_path": config_manager.config_file,
            "current_config": config.model_dump(),
        }
        if os.path.exists(log_dir):
            import glob

            log_files = glob.glob(os.path.join(log_dir, "*.txt"))
            result["log_files_found"] = len(log_files)
            result["log_files"] = log_files
        else:
            result["log_files_found"] = 0
            result["log_files"] = []
        return jsonify(result)
    except Exception as e:
        return jsonify({"error": str(e), "traceback": str(e.__traceback__)}), 500


@game_bp.route("/current-status", methods=["GET"])
def get_current_status(*args: Any, **kwargs: Any) -> Response | tuple[Response, int]:
    """Get current game status from log file"""
    logger.debug("Received request for current status")
    try:
        config_manager = current_app.config['CONFIG_MANAGER']
        config: ConfigModel = config_manager.load_config()
        filepath = get_latest_log_file()
        if config.log_file_path and not filepath:
            configured_filename = os.path.basename(config.log_file_path)
            error_response = GameDataFormatter.create_error_response(
                f"Configured log file not found: {configured_filename}", configured_filename
            )
            return jsonify(error_response.model_dump()), 404
        if not filepath:
            logger.error("No log files found")
            error_response = GameDataFormatter.create_error_response(
                "No log files found in Twilight Struggle directory"
            )
            return jsonify(error_response.model_dump()), 404
        filename = os.path.basename(filepath)
        parser = log_parser.LogParser()
        game = parser.parse_game_log(filepath)
        if not game:
            no_data_response = GameDataFormatter.create_no_game_data_response(filename)
            return jsonify(no_data_response.model_dump())
        play_data = GameDataFormatter.format_play_data(game.current_play, game)
        play_data.filename = filename
        return jsonify(play_data.model_dump())
    except Exception as e:
        logger.error(f"Error in get_current_status: {str(e)}", exc_info=True)
        error_response = GameDataFormatter.create_error_response(str(e))
        return jsonify(error_response.model_dump()), 500


@game_bp.route("/shutdown", methods=["POST"])
def shutdown(*args: Any, **kwargs: Any) -> Response | tuple[Response, int]:
    """Shutdown the server gracefully"""
    try:
        func = request.environ.get("werkzeug.server.shutdown")
        if func is None:
            raise RuntimeError("Not running with the Werkzeug Server")
        func()
        return jsonify({"status": "shutting down"})
    except Exception as e:
        return jsonify({"error": str(e)}), 500
