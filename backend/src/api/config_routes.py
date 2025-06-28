"""
Configuration API routes for Twilight Helper Backend
"""

import logging
from typing import Any

from flask import Blueprint, Response, jsonify, request, current_app
from werkzeug.exceptions import BadRequest, UnsupportedMediaType

from ..models.game_data import ConfigModel

logger = logging.getLogger(__name__)

# Create blueprint for config routes
config_bp = Blueprint("config", __name__, url_prefix="/api/config")


@config_bp.errorhandler(BadRequest)
def handle_bad_request(e: BadRequest) -> tuple[Response, int]:
    return jsonify({"error": str(e)}), 400


@config_bp.errorhandler(UnsupportedMediaType)
def handle_unsupported_media_type(e: UnsupportedMediaType) -> tuple[Response, int]:
    return jsonify({"error": str(e)}), 415


@config_bp.route("/", methods=["GET"])
def get_config(*args: Any, **kwargs: Any) -> Response | tuple[Response, int]:
    """Get current configuration"""
    try:
        config_manager = current_app.config['CONFIG_MANAGER']
        config: ConfigModel = config_manager.load_config()
        return jsonify({"success": True, "config": config.model_dump()})
    except Exception as e:
        logger.error(f"Error getting config: {e}")
        return jsonify({"success": False, "error": str(e)}), 500


@config_bp.route("/", methods=["PUT"])
def update_config(*args: Any, **kwargs: Any) -> Response | tuple[Response, int]:
    """Update configuration"""
    try:
        if not request.is_json:
            return jsonify(
                {"success": False, "error": "Content-Type must be application/json"}
            ), 415
        try:
            data = request.get_json(force=True)
        except BadRequest:
            return jsonify({"success": False, "error": "Malformed JSON"}), 400

        # Empty dict is valid - it means no updates
        if data is None:
            return jsonify({"success": False, "error": "No data provided"}), 400

        config_manager = current_app.config['CONFIG_MANAGER']
        config: ConfigModel = config_manager.update_config(data)
        return jsonify({"success": True, "config": config.model_dump()})

    except Exception as e:
        logger.error(f"Error updating config: {e}")
        return jsonify({"success": False, "error": str(e)}), 500


@config_bp.route("/reset", methods=["POST"])
def reset_config(*args: Any, **kwargs: Any) -> Response | tuple[Response, int]:
    """Reset configuration to defaults"""
    try:
        config_manager = current_app.config['CONFIG_MANAGER']
        config: ConfigModel = config_manager.reset_config()
        return jsonify({"success": True, "config": config.model_dump()})

    except Exception as e:
        logger.error(f"Error resetting config: {e}")
        return jsonify({"success": False, "error": str(e)}), 500
