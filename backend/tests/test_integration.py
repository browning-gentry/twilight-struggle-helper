"""
Integration tests for the complete application flow
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


class TestIntegration(unittest.TestCase):
    """Integration tests for the complete application"""

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

    def test_full_config_workflow(self) -> None:
        """Test the complete configuration workflow"""
        # 1. Get initial config
        response = self.client.get("/api/config/")
        self.assertEqual(response.status_code, 200)

        # 2. Update config
        new_config = {"log_file_path": "/test/path/log.txt", "log_directory": "/test/directory"}
        response = self.client.put(
            "/api/config/", data=json.dumps(new_config), content_type="application/json"
        )
        self.assertEqual(response.status_code, 200)
        updated_config = json.loads(response.data)["config"]
        self.assertEqual(updated_config["log_file_path"], "/test/path/log.txt")

        # 3. Verify config was saved by getting it again
        response = self.client.get("/api/config/")
        self.assertEqual(response.status_code, 200)
        saved_config = json.loads(response.data)["config"]
        self.assertEqual(saved_config["log_file_path"], "/test/path/log.txt")

        # 4. Reset config
        response = self.client.post("/api/config/reset")
        self.assertEqual(response.status_code, 200)
        reset_config = json.loads(response.data)["config"]
        self.assertIsNone(reset_config["log_file_path"])

    @patch("src.api.game_routes.get_latest_log_file")
    @patch("twilight_log_parser.log_parser.LogParser")
    def test_full_game_status_workflow(
        self, mock_parser_class: MagicMock, mock_get_log_file: MagicMock
    ) -> None:
        """Test the complete game status workflow"""
        # Mock successful log parsing
        mock_get_log_file.return_value = "/test/path/game_log.txt"

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

        # 1. Get system info
        response = self.client.get("/api/config/")
        self.assertEqual(response.status_code, 200)

        # 2. Get game status
        response = self.client.get("/api/current-status")
        self.assertEqual(response.status_code, 200)
        game_status = json.loads(response.data)
        self.assertEqual(game_status["status"], "ok")
        self.assertIn("filename", game_status)
        self.assertEqual(game_status["filename"], "game_log.txt")

    def test_cors_headers_across_all_endpoints(self) -> None:
        """Test that CORS headers are properly set across all endpoints"""
        endpoints = ["/api/config/", "/api/test", "/api/current-status"]

        for endpoint in endpoints:
            response = self.client.get(endpoint)
            self.assertIn("Access-Control-Allow-Origin", response.headers)
            self.assertEqual(
                response.headers["Access-Control-Allow-Origin"], "http://localhost:3000"
            )

    def test_error_propagation_across_modules(self) -> None:
        """Test that errors propagate correctly across modules"""
        # Test config error propagation
        with patch("src.config.config_manager.ConfigManager.load_config") as mock_load:
            mock_load.side_effect = Exception("Config error")

            response = self.client.get("/api/config/")
            self.assertEqual(response.status_code, 500)
            data = json.loads(response.data)
            self.assertFalse(data["success"])
            self.assertIn("Config error", data["error"])

    def test_multiple_concurrent_requests(self) -> None:
        """Test handling of multiple concurrent requests"""
        import threading

        results = []
        errors = []

        def make_request() -> None:
            try:
                response = self.client.get("/api/config/")
                results.append(response.status_code)
            except Exception as e:
                errors.append(str(e))

        # Create multiple threads
        threads = []
        for _ in range(5):
            thread = threading.Thread(target=make_request)
            threads.append(thread)
            thread.start()

        # Wait for all threads to complete
        for thread in threads:
            thread.join()

        # Verify all requests succeeded
        self.assertEqual(len(errors), 0)
        self.assertEqual(len(results), 5)
        for status_code in results:
            self.assertEqual(status_code, 200)


if __name__ == "__main__":
    unittest.main()
