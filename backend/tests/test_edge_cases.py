"""
Tests for edge cases and error handling
"""

import json
import os
import shutil
import sys
import tempfile
import unittest
from unittest.mock import MagicMock, patch

# Add the src directory to the path so we can import from the modular structure
sys.path.insert(0, os.path.join(os.path.dirname(os.path.dirname(__file__)), "src"))

from src.app import create_app
from src.config.config_manager import ConfigManager
from src.models.game_data import GameDataFormatter


class TestEdgeCases(unittest.TestCase):
    """Test cases for edge cases and error handling"""

    def setUp(self) -> None:
        """Set up test fixtures before each test method"""
        self.app = create_app()
        self.app.testing = True
        self.client = self.app.test_client()

        # Create a temporary directory for test config files
        self.test_dir = tempfile.mkdtemp()

        # Mock the config file path for testing
        with patch("src.config.config_manager.ConfigManager._get_config_file_path") as mock_path:
            mock_path.return_value = os.path.join(self.test_dir, "test_config.json")

    def tearDown(self) -> None:
        """Clean up after each test method"""
        # Remove temporary directory
        shutil.rmtree(self.test_dir, ignore_errors=True)

    def test_empty_json_request(self) -> None:
        """Test handling of empty JSON in PUT requests"""
        response = self.client.put("/api/config/", data="{}", content_type="application/json")
        self.assertEqual(response.status_code, 200)  # Should use defaults
        data = json.loads(response.data)
        self.assertTrue(data["success"])

    def test_malformed_json_request(self) -> None:
        """Test handling of malformed JSON in PUT requests"""
        response = self.client.put(
            "/api/config/", data='{"invalid": json}', content_type="application/json"
        )
        self.assertEqual(response.status_code, 400)
        data = json.loads(response.data)
        self.assertFalse(data["success"])

    def test_very_large_json_request(self) -> None:
        """Test handling of very large JSON requests"""
        large_data = {
            "log_file_path": "x" * 10000,  # Very long path
            "log_directory": "y" * 10000,  # Very long directory
        }
        response = self.client.put(
            "/api/config/", data=json.dumps(large_data), content_type="application/json"
        )
        self.assertEqual(response.status_code, 200)

    def test_unicode_characters_in_config(self) -> None:
        """Test handling of unicode characters in configuration"""
        unicode_data = {
            "log_file_path": "/path/with/unicode/测试.txt",
            "log_directory": "/directory/with/unicode/测试",
        }
        response = self.client.put(
            "/api/config/", data=json.dumps(unicode_data), content_type="application/json"
        )
        self.assertEqual(response.status_code, 200)
        data = json.loads(response.data)
        self.assertTrue(data["success"])

    def test_special_characters_in_config(self) -> None:
        """Test handling of special characters in configuration"""
        special_data = {
            "log_file_path": "/path/with/special/chars/file (1).txt",
            "log_directory": "/directory/with/spaces and special chars",
        }
        response = self.client.put(
            "/api/config/", data=json.dumps(special_data), content_type="application/json"
        )
        self.assertEqual(response.status_code, 200)

    def test_none_values_in_config(self) -> None:
        """Test handling of None values in configuration"""
        none_data = {
            "log_file_path": None,
            "log_directory": "/test/directory",  # This can't be None, it's required
        }
        response = self.client.put(
            "/api/config/", data=json.dumps(none_data), content_type="application/json"
        )
        self.assertEqual(response.status_code, 200)

    def test_missing_content_type_header(self) -> None:
        """Test handling of requests without content-type header"""
        response = self.client.put("/api/config/", data=json.dumps({"test": "data"}))
        self.assertEqual(response.status_code, 415)  # Unsupported Media Type
        data = json.loads(response.data)
        self.assertIn("error", data)

    def test_wrong_content_type_header(self) -> None:
        """Test handling of requests with wrong content-type header"""
        response = self.client.put(
            "/api/config/", data=json.dumps({"test": "data"}), content_type="text/plain"
        )
        self.assertEqual(response.status_code, 415)  # Unsupported Media Type
        data = json.loads(response.data)
        self.assertIn("error", data)

    def test_empty_request_body(self) -> None:
        """Test handling of empty request body"""
        response = self.client.put("/api/config/", data="", content_type="application/json")
        self.assertEqual(response.status_code, 400)

    def test_none_request_body(self) -> None:
        """Test handling of None request body"""
        response = self.client.put("/api/config/", data=None, content_type="application/json")
        self.assertEqual(response.status_code, 400)

    def test_game_data_with_empty_lists(self) -> None:
        """Test game data formatting with empty lists"""
        mock_game = MagicMock()
        mock_play = MagicMock()

        # Set up mock play data with empty lists
        mock_play.turn = 1
        mock_play.possible_draw_cards = []
        mock_play.discarded_cards = []
        mock_play.removed_cards = []
        mock_play.cards_in_hands = []

        mock_game.CARDS = {}

        result = GameDataFormatter.format_play_data(mock_play, mock_game)

        self.assertEqual(result.turn, 1)
        self.assertEqual(result.deck, [])
        self.assertEqual(result.discarded, [])
        self.assertEqual(result.removed, [])
        self.assertEqual(result.cards_in_hands, [])

    def test_game_data_with_none_values(self) -> None:
        """Test game data formatting with None values"""
        mock_game = MagicMock()
        mock_play = MagicMock()

        # Set up mock play data with None values
        mock_play.turn = None
        mock_play.possible_draw_cards = None
        mock_play.discarded_cards = None
        mock_play.removed_cards = None
        mock_play.cards_in_hands = None

        mock_game.CARDS = {}

        # This should handle None values gracefully
        result = GameDataFormatter.format_play_data(mock_play, mock_game)

        self.assertIsNone(result.turn)
        # Should handle None lists by treating them as empty
        self.assertEqual(result.deck, [])
        self.assertEqual(result.discarded, [])
        self.assertEqual(result.removed, [])
        self.assertEqual(result.cards_in_hands, [])

    def test_config_manager_with_corrupted_config_file(self) -> None:
        """Test config manager with corrupted JSON file"""
        config_manager = ConfigManager()

        # Create a corrupted config file
        with open(config_manager.config_file, "w") as f:
            f.write('{"invalid": json, "missing": quote}')

        # Should handle corrupted file gracefully
        config = config_manager.load_config()
        self.assertIsNotNone(config)
        self.assertIn("log_file_path", config.model_dump())
        self.assertIn("log_directory", config.model_dump())

    def test_config_manager_with_empty_config_file(self) -> None:
        """Test config manager with empty config file"""
        config_manager = ConfigManager()

        # Create an empty config file
        with open(config_manager.config_file, "w") as f:
            f.write("")

        # Should handle empty file gracefully
        config = config_manager.load_config()
        self.assertIsNotNone(config)
        self.assertIn("log_file_path", config.model_dump())
        self.assertIn("log_directory", config.model_dump())

    def test_config_manager_with_permission_error(self) -> None:
        """Test config manager with permission errors"""
        with patch("builtins.open", side_effect=PermissionError("Permission denied")):
            config_manager = ConfigManager()
            config = config_manager.load_config()
            # Should return default config even with permission error
            self.assertIsNotNone(config)

    def test_config_manager_with_io_error(self) -> None:
        """Test config manager with IO errors"""
        with patch("builtins.open", side_effect=OSError("IO Error")):
            config_manager = ConfigManager()
            config = config_manager.load_config()
            # Should return default config even with IO error
            self.assertIsNotNone(config)

    def test_response_with_very_long_error_message(self) -> None:
        """Test response handling with very long error messages"""
        long_error = "x" * 10000
        error_response = GameDataFormatter.create_error_response(long_error)
        self.assertEqual(error_response.status, "error")
        self.assertEqual(error_response.error, long_error)

    def test_response_with_empty_error_message(self) -> None:
        """Test response handling with empty error messages"""
        error_response = GameDataFormatter.create_error_response("")
        self.assertEqual(error_response.status, "error")
        self.assertEqual(error_response.error, "")

    def test_response_with_none_error_message(self) -> None:
        """Test response handling with None error messages"""
        error_response = GameDataFormatter.create_error_response(None)
        self.assertEqual(error_response.status, "error")
        self.assertIsNone(error_response.error)


if __name__ == "__main__":
    unittest.main()
