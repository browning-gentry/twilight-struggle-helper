import json
import os
import shutil
import sys
import tempfile
import unittest
from unittest.mock import MagicMock, patch

# Add the src directory to the path so we can import from the modular structure
sys.path.insert(0, os.path.join(os.path.dirname(os.path.abspath(__file__)), "src"))

from src.app import create_app
from src.config.config_manager import ConfigManager
from src.models.game_data import GameDataFormatter


class TestTwilightHelperBackendModular(unittest.TestCase):
    """Test cases for the modular Twilight Helper Backend Flask application"""

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
            self.config_manager = ConfigManager()
            self.test_config_file = self.config_manager.config_file

    def tearDown(self) -> None:
        """Clean up after each test method"""
        # Remove temporary directory
        shutil.rmtree(self.test_dir, ignore_errors=True)

    def test_get_config_endpoint(self) -> None:
        """Test GET /api/config endpoint"""
        with patch("src.config.config_manager.ConfigManager._get_config_file_path") as mock_path:
            mock_path.return_value = self.test_config_file

            # Test with no existing config file
            response = self.client.get("/api/config/")
            self.assertEqual(response.status_code, 200)
            data = json.loads(response.data)
            self.assertTrue(data["success"])
            self.assertIn("config", data)
            self.assertIn("log_file_path", data["config"])
            self.assertIn("log_directory", data["config"])

            # Test with existing config file
            test_config = {
                "log_file_path": "/test/path/log.txt",
                "log_directory": "/test/directory",
            }
            with open(self.test_config_file, "w") as f:
                json.dump(test_config, f)

            response = self.client.get("/api/config/")
            self.assertEqual(response.status_code, 200)
            data = json.loads(response.data)
            self.assertTrue(data["success"])
            self.assertEqual(data["config"]["log_file_path"], "/test/path/log.txt")
            self.assertEqual(data["config"]["log_directory"], "/test/directory")

    def test_update_config_endpoint(self) -> None:
        """Test PUT /api/config endpoint"""
        with patch("src.config.config_manager.ConfigManager._get_config_file_path") as mock_path:
            mock_path.return_value = self.test_config_file

            # Test updating config
            update_data = {"log_file_path": "/new/path/log.txt", "log_directory": "/new/directory"}
            response = self.client.put(
                "/api/config/", data=json.dumps(update_data), content_type="application/json"
            )
            self.assertEqual(response.status_code, 200)
            data = json.loads(response.data)
            self.assertTrue(data["success"])
            self.assertEqual(data["config"]["log_file_path"], "/new/path/log.txt")
            self.assertEqual(data["config"]["log_directory"], "/new/directory")

            # Test with invalid JSON
            response = self.client.put(
                "/api/config/", data="invalid json", content_type="application/json"
            )
            self.assertEqual(response.status_code, 400)
            data = json.loads(response.data)
            self.assertFalse(data["success"])

    def test_reset_config_endpoint(self) -> None:
        """Test POST /api/config/reset endpoint"""
        with patch("src.config.config_manager.ConfigManager._get_config_file_path") as mock_path:
            mock_path.return_value = self.test_config_file

            # Create an existing config file
            existing_config = {
                "log_file_path": "/old/path/log.txt",
                "log_directory": "/old/directory",
            }
            with open(self.test_config_file, "w") as f:
                json.dump(existing_config, f)

            # Test resetting config
            response = self.client.post("/api/config/reset")
            self.assertEqual(response.status_code, 200)
            data = json.loads(response.data)
            self.assertTrue(data["success"])
            self.assertIsNone(data["config"]["log_file_path"])
            self.assertIn("log_directory", data["config"])

    def test_test_endpoint(self) -> None:
        """Test GET /api/test endpoint"""
        with patch("src.config.config_manager.ConfigManager._get_config_file_path") as mock_path:
            mock_path.return_value = self.test_config_file

            response = self.client.get("/api/test")
            self.assertEqual(response.status_code, 200)
            data = json.loads(response.data)

            # Check that all expected fields are present
            expected_fields = [
                "log_dir_exists",
                "log_dir_path",
                "platform",
                "userprofile",
                "documents_path",
                "config_file_path",
                "current_config",
                "log_files_found",
                "log_files",
            ]
            for field in expected_fields:
                self.assertIn(field, data)

    @patch("src.utils.log_utils.get_latest_log_file")
    @patch("twilight_log_parser.log_parser.LogParser")
    def test_get_current_status_endpoint_success(
        self, mock_parser_class: MagicMock, mock_get_log_file: MagicMock
    ) -> None:
        """Test GET /api/current-status endpoint with successful log parsing"""
        # Mock the log file path
        mock_get_log_file.return_value = "/test/path/game_log.txt"

        # Mock the parser and game state
        mock_parser = MagicMock()
        mock_game = MagicMock()
        mock_play = MagicMock()

        # Set up mock game data
        mock_play.turn = 1
        mock_play.possible_draw_cards = ["Card1", "Card2"]
        mock_play.discarded_cards = ["Card3"]
        mock_play.removed_cards = ["Card4"]
        mock_play.cards_in_hands = ["Card5", "Card6"]

        mock_game.current_play = mock_play
        mock_game.CARDS = {
            "Card1": MagicMock(name="Card1", side="USSR", ops=2),
            "Card2": MagicMock(name="Card2", side="US", ops=3),
            "Card3": MagicMock(name="Card3", side="USSR", ops=1),
            "Card4": MagicMock(name="Card4", side="US", ops=4),
            "Card5": MagicMock(name="Card5", side="USSR", ops=2),
            "Card6": MagicMock(name="Card6", side="US", ops=3),
        }

        mock_parser.parse_game_log.return_value = mock_game
        mock_parser_class.return_value = mock_parser

        response = self.client.get("/api/current-status")
        self.assertEqual(response.status_code, 200)
        data = json.loads(response.data)

        self.assertEqual(data["status"], "ok")
        self.assertEqual(data["filename"], "game_log.txt")
        self.assertEqual(data["turn"], 1)
        self.assertEqual(len(data["deck"]), 2)
        self.assertEqual(len(data["discarded"]), 1)
        self.assertEqual(len(data["removed"]), 1)
        self.assertEqual(len(data["cards_in_hands"]), 2)

    def test_cors_headers(self) -> None:
        """Test that CORS headers are properly set"""
        response = self.client.get("/api/config/")
        self.assertIn("Access-Control-Allow-Origin", response.headers)
        self.assertEqual(response.headers["Access-Control-Allow-Origin"], "http://localhost:3000")

    def test_game_data_formatter(self) -> None:
        """Test GameDataFormatter utility functions"""
        # Test error response creation
        error_response = GameDataFormatter.create_error_response("Test error", "test.txt")
        self.assertIn("error", error_response.model_dump())
        self.assertEqual(error_response.error, "Test error")
        self.assertEqual(error_response.filename, "test.txt")
        self.assertEqual(error_response.deck, [])

        # Test no game data response creation
        no_data_response = GameDataFormatter.create_no_game_data_response("test.txt")
        self.assertEqual(no_data_response.status, "no game data")
        self.assertEqual(no_data_response.filename, "test.txt")
        self.assertEqual(no_data_response.deck, [])

    def test_config_manager(self) -> None:
        """Test ConfigManager functionality"""
        with patch("src.config.config_manager.ConfigManager._get_config_file_path") as mock_path:
            mock_path.return_value = self.test_config_file
            config_manager = ConfigManager()

            # Test loading default config
            config = config_manager.load_config()
            self.assertIsNone(config.log_file_path)
            self.assertIsNotNone(config.log_directory)

            # Test saving and loading config
            from src.models.game_data import ConfigModel

            test_config = ConfigModel(
                log_file_path="/test/path/log.txt", log_directory="/test/directory"
            )
            success = config_manager.save_config(test_config)
            self.assertTrue(success)

            loaded_config = config_manager.load_config()
            self.assertEqual(loaded_config.log_file_path, "/test/path/log.txt")


if __name__ == "__main__":
    unittest.main()
