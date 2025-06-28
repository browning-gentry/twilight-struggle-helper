"""
Tests for game API routes
"""

import os
import tempfile
import unittest
from unittest.mock import MagicMock, patch

from src.app import create_app
from src.config.config_manager import ConfigManager
from src.models.game_data import ConfigModel


class TestGameRoutes(unittest.TestCase):
    """Test cases for game API routes"""

    def setUp(self) -> None:
        """Set up test client"""
        # Create a temporary directory for test config files
        self.temp_dir = tempfile.mkdtemp()
        self.test_config_file = os.path.join(self.temp_dir, "test_config.json")
        
        # Create a test-specific config manager
        self.test_config_manager = ConfigManager()
        self.test_config_manager.config_file = self.test_config_file
        
        # Create app with test config manager
        self.app = create_app(config_manager=self.test_config_manager)
        self.app.testing = True
        self.client = self.app.test_client()

    def tearDown(self) -> None:
        """Clean up after each test method"""
        # Clean up temporary files
        if os.path.exists(self.test_config_file):
            os.remove(self.test_config_file)
        if os.path.exists(self.temp_dir):
            os.rmdir(self.temp_dir)

    def test_test_endpoint(self) -> None:
        """Test the test endpoint"""
        # Set up config
        test_config = ConfigModel(
            log_file_path="test.txt", log_directory="/test/directory"
        )
        with open(self.test_config_file, "w") as f:
            import json
            json.dump(test_config.model_dump(), f)

        with patch("os.path.exists") as mock_exists:
            mock_exists.return_value = True

            with patch("glob.glob") as mock_glob:
                mock_glob.return_value = ["/test/path/file1.txt", "/test/path/file2.txt"]

                response = self.client.get("/api/test")
                data = response.get_json()

                self.assertEqual(response.status_code, 200)
                self.assertTrue(data["log_dir_exists"])
                self.assertEqual(data["log_files_found"], 2)

    def test_current_status_success(self) -> None:
        """Test successful current status endpoint"""
        # Set up config
        test_config = ConfigModel(
            log_file_path="/test/path/game.txt", log_directory="/test/directory"
        )
        with open(self.test_config_file, "w") as f:
            import json
            json.dump(test_config.model_dump(), f)

        with patch("src.api.game_routes.get_latest_log_file") as mock_get_file:
            mock_get_file.return_value = "/test/path/game.txt"

            with patch("src.api.game_routes.log_parser.LogParser") as mock_parser_class:
                mock_parser = MagicMock()
                mock_parser_class.return_value = mock_parser

                # Create mock game and play objects
                mock_game = MagicMock()
                mock_play = MagicMock()
                mock_play.turn = 3
                mock_play.possible_draw_cards = ["Cuba"]
                mock_play.discarded_cards = []
                mock_play.removed_cards = []
                mock_play.cards_in_hands = []

                mock_game.current_play = mock_play

                # Create a proper mock card object
                mock_cuba_card = MagicMock()
                mock_cuba_card.name = "Cuba"
                mock_cuba_card.side = "USSR"
                mock_cuba_card.ops = 2

                mock_game.CARDS = {"Cuba": mock_cuba_card}

                mock_parser.parse_game_log.return_value = mock_game

                response = self.client.get("/api/current-status")
                data = response.get_json()

                self.assertEqual(response.status_code, 200)
                self.assertEqual(data["status"], "ok")
                self.assertEqual(data["filename"], "game.txt")
                self.assertEqual(data["turn"], 3)
                self.assertEqual(len(data["deck"]), 1)
                self.assertEqual(data["deck"][0]["name"], "Cuba")

    def test_current_status_no_log_files(self) -> None:
        """Test current status when no log files are found"""
        # Set up config with no log file path
        test_config = ConfigModel(
            log_file_path=None, log_directory="/test/directory"
        )
        with open(self.test_config_file, "w") as f:
            import json
            json.dump(test_config.model_dump(), f)

        with patch("src.api.game_routes.get_latest_log_file") as mock_get_file:
            mock_get_file.return_value = None

            response = self.client.get("/api/current-status")
            data = response.get_json()

            self.assertEqual(response.status_code, 404)
            self.assertEqual(data["status"], "error")
            self.assertIn("No log files found", data["error"])

    def test_current_status_configured_file_not_found(self) -> None:
        """Test current status when configured file is not found"""
        # Set up config with a specific log file path
        test_config = ConfigModel(
            log_file_path="/test/missing.txt", log_directory="/test/directory"
        )
        with open(self.test_config_file, "w") as f:
            import json
            json.dump(test_config.model_dump(), f)

        with patch("src.api.game_routes.get_latest_log_file") as mock_get_file:
            mock_get_file.return_value = None

            response = self.client.get("/api/current-status")
            data = response.get_json()

            self.assertEqual(response.status_code, 404)
            self.assertEqual(data["status"], "error")
            self.assertIn("Configured log file not found", data["error"])

    def test_current_status_no_game_data(self) -> None:
        """Test current status when parser returns no game data"""
        # Set up config
        test_config = ConfigModel(
            log_file_path="/test/path/game.txt", log_directory="/test/directory"
        )
        with open(self.test_config_file, "w") as f:
            import json
            json.dump(test_config.model_dump(), f)

        with patch("src.api.game_routes.get_latest_log_file") as mock_get_file:
            mock_get_file.return_value = "/test/path/game.txt"

            with patch("src.api.game_routes.log_parser.LogParser") as mock_parser_class:
                mock_parser = MagicMock()
                mock_parser_class.return_value = mock_parser
                mock_parser.parse_game_log.return_value = None

                response = self.client.get("/api/current-status")
                data = response.get_json()

                self.assertEqual(response.status_code, 200)
                self.assertEqual(data["status"], "no game data")
                self.assertEqual(data["filename"], "game.txt")

    def test_current_status_parser_exception(self) -> None:
        """Test current status when parser raises an exception"""
        # Set up config
        test_config = ConfigModel(
            log_file_path="/test/path/game.txt", log_directory="/test/directory"
        )
        with open(self.test_config_file, "w") as f:
            import json
            json.dump(test_config.model_dump(), f)

        with patch("src.api.game_routes.get_latest_log_file") as mock_get_file:
            mock_get_file.return_value = "/test/path/game.txt"

            with patch("src.api.game_routes.log_parser.LogParser") as mock_parser_class:
                mock_parser = MagicMock()
                mock_parser_class.return_value = mock_parser
                mock_parser.parse_game_log.side_effect = Exception("Parser error")

                response = self.client.get("/api/current-status")
                data = response.get_json()

                self.assertEqual(response.status_code, 500)
                self.assertEqual(data["status"], "error")
                self.assertIn("Parser error", data["error"])

    def test_shutdown_endpoint(self) -> None:
        """Test shutdown endpoint"""
        with self.app.test_request_context():
            with patch("src.api.game_routes.request") as mock_request:
                mock_request.environ = {"werkzeug.server.shutdown": MagicMock()}

                response = self.client.post("/api/shutdown")
                data = response.get_json()

                self.assertEqual(response.status_code, 200)
                self.assertEqual(data["status"], "shutting down")

    def test_shutdown_endpoint_no_werkzeug(self) -> None:
        """Test shutdown endpoint when not running with Werkzeug"""
        with self.app.test_request_context():
            with patch("src.api.game_routes.request") as mock_request:
                mock_request.environ = {}

                response = self.client.post("/api/shutdown")
                data = response.get_json()

                self.assertEqual(response.status_code, 500)
                self.assertIn("error", data)


if __name__ == "__main__":
    unittest.main()
