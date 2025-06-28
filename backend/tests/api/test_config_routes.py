"""
Tests for configuration API routes
"""

import json
import os
import tempfile
import unittest

from src.app import create_app
from src.config.config_manager import ConfigManager
from src.models.game_data import ConfigModel


class TestConfigRoutes(unittest.TestCase):
    """Test cases for configuration API routes"""

    def setUp(self) -> None:
        """Set up test fixtures before each test method"""
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

    def test_get_config_endpoint(self) -> None:
        """Test GET /api/config endpoint"""
        # Test with no existing config file
        response = self.client.get("/api/config/")
        self.assertEqual(response.status_code, 200)
        data = json.loads(response.data)
        self.assertTrue(data["success"])
        self.assertIn("config", data)
        self.assertIn("log_file_path", data["config"])
        self.assertIn("log_directory", data["config"])
        expected_default = "/default/directory"
        actual_default = data["config"]["log_directory"]
        self.assertTrue(
            actual_default == expected_default or actual_default.endswith("Twilight Struggle")
        )

        # Test with existing config file
        test_config = ConfigModel(
            log_file_path="/test/path/log.txt", log_directory="/test/directory"
        )
        with open(self.test_config_file, "w") as f:
            json.dump(test_config.model_dump(), f)

        response = self.client.get("/api/config/")
        self.assertEqual(response.status_code, 200)
        data = json.loads(response.data)
        self.assertTrue(data["success"])
        self.assertEqual(data["config"]["log_file_path"], "/test/path/log.txt")
        self.assertEqual(data["config"]["log_directory"], "/test/directory")

    def test_update_config_endpoint(self) -> None:
        """Test PUT /api/config endpoint"""
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

        # Test with no data (should use defaults)
        response = self.client.put(
            "/api/config/", data=json.dumps({}), content_type="application/json"
        )
        self.assertEqual(response.status_code, 200)
        data = json.loads(response.data)
        self.assertTrue(data["success"])
        # Should have default values
        self.assertIsNotNone(data["config"]["log_directory"])

    def test_reset_config_endpoint(self) -> None:
        """Test POST /api/config/reset endpoint"""
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

    def test_cors_headers(self) -> None:
        """Test that CORS headers are properly set"""
        response = self.client.get("/api/config/")
        self.assertIn("Access-Control-Allow-Origin", response.headers)
        self.assertEqual(response.headers["Access-Control-Allow-Origin"], "http://localhost:3000")


if __name__ == "__main__":
    unittest.main()
