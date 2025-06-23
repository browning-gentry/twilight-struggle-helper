"""
Tests for game API routes
"""

import os
import sys
import unittest
from unittest.mock import MagicMock, patch

# Add the src directory to the path so we can import from the modular structure
sys.path.insert(0, os.path.join(os.path.dirname(os.path.dirname(os.path.dirname(__file__))), "src"))

from src.api.game_routes import game_bp
from src.models.game_data import ConfigModel


class TestGameRoutes(unittest.TestCase):
    """Test cases for game API routes"""

    def setUp(self) -> None:
        """Set up test client"""
        from flask import Flask

        self.app = Flask(__name__)
        self.app.register_blueprint(game_bp)
        self.client = self.app.test_client()

    def test_test_endpoint(self) -> None:
        """Test the test endpoint"""
        with patch("src.config.config_manager.config_manager") as mock_config_manager:
            mock_config_manager.load_config.return_value = ConfigModel(
                log_file_path="test.txt", log_directory="/test/directory"
            )
            mock_config_manager.get_default_log_directory.return_value = "/test/path"
            mock_config_manager.config_file = "/test/config.json"

            with patch("os.path.exists") as mock_exists:
                mock_exists.return_value = True

                with patch("glob.glob") as mock_glob:
                    mock_glob.return_value = ["/test/path/file1.txt", "/test/path/file2.txt"]

                    response = self.client.get("/api/test")
                    data = response.get_json()

                    self.assertEqual(response.status_code, 200)
                    self.assertTrue(data["log_dir_exists"])
                    self.assertEqual(data["log_dir_path"], "/test/path")
                    self.assertEqual(data["log_files_found"], 2)

    def test_current_status_success(self) -> None:
        """Test successful current status endpoint"""
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
        with patch("src.api.game_routes.get_latest_log_file") as mock_get_file:
            mock_get_file.return_value = None

            with patch("src.config.config_manager.config_manager") as mock_config_manager:
                mock_config_manager.load_config.return_value = ConfigModel(
                    log_file_path=None, log_directory="/test/directory"
                )

                response = self.client.get("/api/current-status")
                data = response.get_json()

                self.assertEqual(response.status_code, 200)
                self.assertEqual(data["status"], "error")
                self.assertIn("No log files found", data["error"])

    def test_current_status_configured_file_not_found(self) -> None:
        """Test current status when configured file is not found"""
        with patch("src.api.game_routes.get_latest_log_file") as mock_get_file:
            mock_get_file.return_value = None

            with patch("src.config.config_manager.config_manager") as mock_config_manager:
                mock_config_manager.load_config.return_value = ConfigModel(
                    log_file_path="/test/missing.txt", log_directory="/test/directory"
                )

                response = self.client.get("/api/current-status")
                data = response.get_json()

                self.assertEqual(response.status_code, 200)
                self.assertEqual(data["status"], "error")
                self.assertIn("missing.txt", data["error"])
                self.assertEqual(data["filename"], "missing.txt")

    def test_current_status_no_game_data(self) -> None:
        """Test current status when parser returns no game data"""
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
