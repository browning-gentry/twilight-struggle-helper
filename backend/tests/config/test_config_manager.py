"""
Tests for configuration manager
"""

import json
import os
import shutil
import sys
import tempfile
import unittest
from unittest.mock import patch

# Add the src directory to the path so we can import from the modular structure
sys.path.insert(0, os.path.join(os.path.dirname(os.path.dirname(os.path.dirname(__file__))), "src"))

from src.config.config_manager import ConfigManager
from src.models.game_data import ConfigModel


class TestConfigManager(unittest.TestCase):
    """Test cases for ConfigManager"""

    def setUp(self) -> None:
        """Set up test fixtures before each test method"""
        # Create a temporary directory for test config files
        self.test_dir = tempfile.mkdtemp()

        # Mock the config file path for testing
        with patch("src.config.config_manager.ConfigManager._get_config_file_path") as mock_path:
            mock_path.return_value = os.path.join(self.test_dir, "test_config.json")
            self.config_manager = ConfigManager()
            self.test_config_file = self.config_manager.config_file

    def tearDown(self) -> None:
        """Clean up after each test method"""
        # Remove temporary directory
        shutil.rmtree(self.test_dir, ignore_errors=True)

    def test_load_config_function(self) -> None:
        """Test load_config function"""
        # Test loading non-existent config (should return defaults)
        config = self.config_manager.load_config()
        self.assertIsNone(config.log_file_path)
        self.assertIsNotNone(config.log_directory)

        # Test loading existing config
        test_config = {"log_file_path": "/test/path/log.txt", "log_directory": "/test/directory"}
        with open(self.test_config_file, "w") as f:
            json.dump(test_config, f)

        config = self.config_manager.load_config()
        self.assertEqual(config.log_file_path, "/test/path/log.txt")
        self.assertEqual(config.log_directory, "/test/directory")

    def test_save_config_function(self) -> None:
        """Test save_config function"""
        test_config = ConfigModel(
            log_file_path="/test/path/log.txt", log_directory="/test/directory"
        )

        # Test successful save
        result = self.config_manager.save_config(test_config)
        self.assertTrue(result)

        # Verify the file was created and contains correct data
        with open(self.test_config_file) as f:
            saved_config = json.load(f)
        self.assertEqual(saved_config["log_file_path"], "/test/path/log.txt")
        self.assertEqual(saved_config["log_directory"], "/test/directory")

    def test_get_default_log_directory_function(self) -> None:
        """Test get_default_log_directory function"""
        directory = self.config_manager.get_default_log_directory()
        self.assertIsInstance(directory, str)
        self.assertGreater(len(directory), 0)

    def test_reset_config(self) -> None:
        """Test reset_config function"""
        # Create an existing config file
        existing_config = {"log_file_path": "/old/path/log.txt", "log_directory": "/old/directory"}
        with open(self.test_config_file, "w") as f:
            json.dump(existing_config, f)

        # Test resetting config
        config = self.config_manager.reset_config()
        self.assertIsNone(config.log_file_path)
        self.assertIsNotNone(config.log_directory)

    def test_update_config(self) -> None:
        """Test update_config function"""
        # Test updating config
        update_data = {"log_file_path": "/new/path/log.txt", "log_directory": "/new/directory"}

        config = self.config_manager.update_config(update_data)
        self.assertEqual(config.log_file_path, "/new/path/log.txt")
        self.assertEqual(config.log_directory, "/new/directory")

        # Test partial update
        partial_update = {"log_file_path": "/partial/path/log.txt"}
        config = self.config_manager.update_config(partial_update)
        self.assertEqual(config.log_file_path, "/partial/path/log.txt")
        # Should preserve existing log_directory
        self.assertEqual(config.log_directory, "/new/directory")

    def test_config_file_path_platform_specific(self) -> None:
        """Test that config file path is platform-specific"""
        with patch("sys.platform", "win32"):
            with patch("os.environ.get", return_value="C:\\Users\\Test\\AppData\\Roaming"):
                config_manager = ConfigManager()
                self.assertIn("AppData\\Roaming", config_manager.config_file)

        with patch("sys.platform", "darwin"):
            with patch("os.path.expanduser", return_value="/tmp/test_user"):
                with patch("os.makedirs") as mock_makedirs:  # Prevent actual directory creation
                    config_manager = ConfigManager()
                    self.assertIn("/tmp/test_user", config_manager.config_file)
                    mock_makedirs.assert_called()


if __name__ == "__main__":
    unittest.main()
