"""
Log file utilities for Twilight Helper Backend
"""

import logging
import os
from pathlib import Path
from typing import Any

from ..config.config_manager import config_manager
from ..models.game_data import ConfigModel

logger = logging.getLogger(__name__)


def get_latest_log_file() -> str | None:
    """
    Get the path to the latest log file based on configuration

    Returns:
        str: Path to the latest log file, or None if no log files found
    """
    try:
        config: ConfigModel = config_manager.load_config()
        logger.info(f"Loaded config: {config}")

        # If a specific log file is configured, use it
        if config.log_file_path:
            logger.info(f"Specific log file configured: {config.log_file_path}")
            # Construct full path if it's just a filename
            if os.path.isabs(config.log_file_path):
                # It's already a full path
                log_file_path = config.log_file_path
            else:
                # It's a relative filename, combine with log directory
                log_dir = Path(config.log_directory or config_manager.get_default_log_directory())
                log_file_path = str(log_dir / config.log_file_path)

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
        log_dir = Path(config.log_directory or config_manager.get_default_log_directory())
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
    """
    Get information about the log directory and available log files

    Returns:
        dict: Information about log directory and files
    """
    config: ConfigModel = config_manager.load_config()
    log_dir = Path(config.log_directory or config_manager.get_default_log_directory())

    result = {
        "log_dir_exists": log_dir.exists(),
        "log_dir_path": str(log_dir),
        "platform": os.name,
        "userprofile": os.environ.get('USERPROFILE', 'Not set'),
        "documents_path": config_manager.get_default_log_directory(),
        "config_file_path": config_manager.config_file,
        "current_config": config.model_dump()
    }

    if log_dir.exists():
        log_files = list(log_dir.glob('*.txt'))
        result["log_files_found"] = len(log_files)
        result["log_files"] = [str(f) for f in log_files]
    else:
        result["log_files_found"] = 0
        result["log_files"] = []

    return result
