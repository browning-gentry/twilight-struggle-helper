"""
Configuration management for Twilight Helper Backend
"""

import json
import logging
import os
import sys
from pathlib import Path
from typing import Any

from ..models.game_data import ConfigModel

logger = logging.getLogger(__name__)


class ConfigManager:
    """Manages application configuration"""

    def __init__(self) -> None:
        self.config_file = self._get_config_file_path()
        self._ensure_config_directory()

    def _get_config_file_path(self) -> str:
        """Get the configuration file path based on platform"""
        if sys.platform.startswith("win"):
            # Windows: %APPDATA%/Twilight Struggle Helper/
            app_data_dir = os.path.join(os.environ.get("APPDATA", ""), "Twilight Struggle Helper")
        elif sys.platform.startswith("darwin"):
            # macOS: ~/Library/Application Support/Twilight Struggle Helper/
            app_data_dir = os.path.join(
                os.path.expanduser("~"),
                "Library",
                "Application Support",
                "Twilight Struggle Helper",
            )
        else:
            # Linux: ~/.config/Twilight Struggle Helper/
            app_data_dir = os.path.join(
                os.path.expanduser("~"), ".config", "Twilight Struggle Helper"
            )

        return os.path.join(app_data_dir, "config.json")

    def _ensure_config_directory(self) -> None:
        """Ensure the configuration directory exists"""
        config_dir = os.path.dirname(self.config_file)
        os.makedirs(config_dir, exist_ok=True)

    def get_default_log_directory(self) -> str:
        """Get the default log directory based on platform"""
        if sys.platform.startswith("win"):
            # Use a more robust method to get Documents folder on Windows
            try:
                import winreg

                with winreg.OpenKey(
                    winreg.HKEY_CURRENT_USER,
                    r"Software\Microsoft\Windows\CurrentVersion\Explorer\Shell Folders",
                ) as key:
                    documents = winreg.QueryValueEx(key, "Personal")[0]
            except (ImportError, FileNotFoundError, OSError):
                # Fallback to USERPROFILE\Documents if registry method fails
                documents = os.path.join(os.environ.get("USERPROFILE", ""), "Documents")

            return str(Path(documents) / "Twilight Struggle")

        # For macOS and Linux, use Desktop instead of Documents
        return str(Path(os.path.expanduser("~")) / "Desktop" / "Twilight Struggle")

    def load_config(self) -> ConfigModel:
        """Load configuration from file"""
        default_config = ConfigModel(
            log_file_path=None, log_directory=self.get_default_log_directory()
        )

        try:
            if os.path.exists(self.config_file):
                with open(self.config_file) as f:
                    config = json.load(f)
                    # Merge with defaults to ensure all keys exist
                    data = {**default_config.model_dump(), **config}
                    return ConfigModel(**data)
        except Exception as e:
            logger.error(f"Error loading config: {e}")

        return default_config

    def save_config(self, config: ConfigModel) -> bool:
        """Save configuration to file"""
        try:
            with open(self.config_file, "w") as f:
                json.dump(config.model_dump(), f, indent=2)
            return True
        except Exception as e:
            logger.error(f"Error saving config: {e}")
            return False

    def reset_config(self) -> ConfigModel:
        """Reset configuration to defaults"""
        default_config = ConfigModel(
            log_file_path=None, log_directory=self.get_default_log_directory()
        )

        if self.save_config(default_config):
            return default_config
        else:
            raise RuntimeError("Failed to save configuration")

    def update_config(self, updates: dict[str, Any]) -> ConfigModel:
        """Update configuration with new values"""
        config = self.load_config()
        data = config.model_dump()

        # Update config with provided data
        if "log_file_path" in updates:
            data["log_file_path"] = updates["log_file_path"]
        if "log_directory" in updates:
            data["log_directory"] = updates["log_directory"]

        new_config = ConfigModel(**data)
        # Save the updated config
        if self.save_config(new_config):
            return new_config
        else:
            raise RuntimeError("Failed to save configuration")


# Global config manager instance
config_manager = ConfigManager()
