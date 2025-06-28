import json
import os
import tempfile
import unittest
from unittest.mock import MagicMock, patch

from src.app import create_app
from src.config.config_manager import ConfigManager
from src.models.game_data import GameDataFormatter


class TestConfigManager(ConfigManager):
    """Test-specific config manager that allows setting config file path"""

    def __init__(self, config_file_path: str) -> None:
        self.config_file = config_file_path
        self._ensure_config_directory()


class TestTwilightHelperBackendModular(unittest.TestCase):
    """Test cases for the modular Twilight Helper Backend Flask application"""

    def setUp(self) -> None:  # type: ignore
        """Set up test fixtures before each test method"""
        # Create a temporary directory for test config files
        self.temp_dir = tempfile.mkdtemp()
        self.test_config_file = os.path.join(self.temp_dir, "test_config.json")

        # Create a test-specific config manager
        self.test_config_manager = TestConfigManager(self.test_config_file)  # type: ignore

        # Create app with test config manager
        self.app = create_app(config_manager=self.test_config_manager)  # type: ignore
        self.app.testing = True
        self.client = self.app.test_client()

    def tearDown(self) -> None:
        """Clean up after each test method"""
        # Clean up temporary files
        if os.path.exists(self.test_config_file):
            os.remove(self.test_config_file)
        if os.path.exists(self.temp_dir):
            os.rmdir(self.temp_dir)

    def test_get_config_endpoint(self) -> None:
        """Test GET /api/config endpoint"""
        # Remove any existing config file
        if os.path.exists(self.test_config_file):
            os.remove(self.test_config_file)

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
        # Test updating config
        update_data = {
            "log_file_path": "/new/path/log.txt",
            "log_directory": "/new/directory",
        }
        response = self.client.put(
            "/api/config/",
            data=json.dumps(update_data),
            content_type="application/json",
        )
        self.assertEqual(response.status_code, 200)
        data = json.loads(response.data)
        self.assertTrue(data["success"])
        self.assertEqual(data["config"]["log_file_path"], "/new/path/log.txt")
        self.assertEqual(data["config"]["log_directory"], "/new/directory")

        # Verify config file was updated
        with open(self.test_config_file) as f:
            saved_config = json.load(f)
        self.assertEqual(saved_config["log_file_path"], "/new/path/log.txt")

    def test_reset_config_endpoint(self) -> None:
        """Test POST /api/config/reset endpoint"""
        # First set some custom config
        update_data = {
            "log_file_path": "/custom/path/log.txt",
            "log_directory": "/custom/directory",
        }
        self.client.put(
            "/api/config/",
            data=json.dumps(update_data),
            content_type="application/json",
        )

        # Then reset to defaults
        response = self.client.post("/api/config/reset")
        self.assertEqual(response.status_code, 200)
        data = json.loads(response.data)
        self.assertTrue(data["success"])
        # Should have default values
        self.assertNotEqual(data["config"]["log_file_path"], "/custom/path/log.txt")

    def test_get_current_status_endpoint_success(self) -> None:
        """Test GET /api/current-status endpoint with success"""
        # Set up config with a log file path
        test_config = {
            "log_file_path": "/test/path/test-game.log",
            "log_directory": "/test/directory",
        }
        with open(self.test_config_file, "w") as f:
            json.dump(test_config, f)

        # Mock the log file and parser
        with patch("src.api.game_routes.get_latest_log_file") as mock_get_file:
            with patch("src.api.game_routes.log_parser.LogParser") as mock_parser_class:
                mock_get_file.return_value = "/test/path/test-game.log"
                mock_parser = MagicMock()
                mock_parser_class.return_value = mock_parser
                mock_game = MagicMock()
                mock_parser.parse_game_log.return_value = mock_game
                mock_play = MagicMock()
                mock_game.current_play = mock_play
                mock_play.turn = 1
                mock_play.possible_draw_cards = []
                mock_play.discarded_cards = []
                mock_play.removed_cards = []
                mock_play.cards_in_hands = []

                response = self.client.get("/api/current-status")
                self.assertEqual(response.status_code, 200)
                data = json.loads(response.data)
                self.assertEqual(data["turn"], 1)
                self.assertEqual(data["filename"], "test-game.log")

    def test_get_current_status_endpoint_no_log_files(self) -> None:
        """Test GET /api/current-status endpoint with no log files"""
        # Set up config with a log file path
        test_config = {
            "log_file_path": "/test/path/test-game.log",
            "log_directory": "/test/directory",
        }
        with open(self.test_config_file, "w") as f:
            json.dump(test_config, f)

        # Mock no log files found
        with patch("src.api.game_routes.get_latest_log_file") as mock_get_file:
            mock_get_file.return_value = None

            response = self.client.get("/api/current-status")
            self.assertEqual(response.status_code, 404)
            data = json.loads(response.data)
            self.assertIn("error", data)

    def test_get_current_status_endpoint_no_game_data(self) -> None:
        """Test GET /api/current-status endpoint with no game data"""
        # Set up config with a log file path
        test_config = {
            "log_file_path": "/test/path/test-game.log",
            "log_directory": "/test/directory",
        }
        with open(self.test_config_file, "w") as f:
            json.dump(test_config, f)

        # Mock log file found but no game data
        with patch("src.api.game_routes.get_latest_log_file") as mock_get_file:
            with patch("src.api.game_routes.log_parser.LogParser") as mock_parser_class:
                mock_get_file.return_value = "/test/path/test-game.log"
                mock_parser = MagicMock()
                mock_parser_class.return_value = mock_parser
                mock_parser.parse_game_log.return_value = None

                response = self.client.get("/api/current-status")
                self.assertEqual(response.status_code, 200)
                data = json.loads(response.data)
                self.assertEqual(data["status"], "no game data")
                self.assertEqual(data["filename"], "test-game.log")

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
