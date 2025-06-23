"""
Tests for the Flask application factory and configuration
"""

import os
import sys
import unittest
from unittest.mock import patch

# Add the src directory to the path so we can import from the modular structure
sys.path.insert(0, os.path.join(os.path.dirname(os.path.dirname(__file__)), "src"))

from src.app import create_app


class TestAppFactory(unittest.TestCase):
    """Test cases for the Flask application factory"""

    def test_create_app_returns_flask_app(self) -> None:
        """Test that create_app returns a Flask application"""
        app = create_app()
        from flask import Flask

        self.assertIsInstance(app, Flask)

    def test_create_app_registers_blueprints(self) -> None:
        """Test that create_app registers all required blueprints"""
        app = create_app()

        # Check that blueprints are registered
        blueprint_names = [bp.name for bp in app.blueprints.values()]
        self.assertIn("config", blueprint_names)
        self.assertIn("game", blueprint_names)

    def test_create_app_configures_cors(self) -> None:
        """Test that create_app configures CORS properly"""
        app = create_app()

        # Test that CORS is configured by making a request
        with app.test_client() as client:
            response = client.get("/api/config/")
            self.assertIn("Access-Control-Allow-Origin", response.headers)

    def test_create_app_testing_mode(self) -> None:
        """Test that create_app works in testing mode"""
        app = create_app()
        app.testing = True

        with app.test_client() as client:
            response = client.get("/api/config/")
            self.assertEqual(response.status_code, 200)

    def test_app_blueprint_routes(self) -> None:
        """Test that all expected routes are available"""
        app = create_app()

        with app.test_client() as client:
            # Test config routes
            response = client.get("/api/config/")
            self.assertEqual(response.status_code, 200)

            response = client.post("/api/config/reset")
            self.assertEqual(response.status_code, 200)

            # Test game routes
            response = client.get("/api/test")
            self.assertEqual(response.status_code, 200)

            response = client.get("/api/current-status")
            self.assertEqual(response.status_code, 200)

    def test_app_error_handling(self) -> None:
        """Test that the app handles errors gracefully"""
        app = create_app()

        with app.test_client() as client:
            # Test 404 for non-existent route
            response = client.get("/api/nonexistent")
            self.assertEqual(response.status_code, 404)

    def test_app_configuration(self) -> None:
        """Test that the app has proper configuration"""
        app = create_app()

        # Test that app has required configuration
        self.assertTrue(hasattr(app, "config"))
        self.assertTrue(hasattr(app, "blueprints"))

    def test_multiple_app_instances(self) -> None:
        """Test that multiple app instances can be created"""
        app1 = create_app()
        app2 = create_app()

        # They should be different instances
        self.assertIsNot(app1, app2)

        # But both should work
        with app1.test_client() as client1:
            response1 = client1.get("/api/config/")
            self.assertEqual(response1.status_code, 200)

        with app2.test_client() as client2:
            response2 = client2.get("/api/config/")
            self.assertEqual(response2.status_code, 200)

    def test_app_with_different_environments(self) -> None:
        """Test app creation in different environments"""
        # Test with DEBUG=1
        with patch.dict(os.environ, {"DEBUG": "1"}):
            app = create_app()
            self.assertIsInstance(app, type(create_app()))

        # Test with DEBUG=0
        with patch.dict(os.environ, {"DEBUG": "0"}):
            app = create_app()
            self.assertIsInstance(app, type(create_app()))

    def test_app_blueprint_url_prefixes(self) -> None:
        """Test that blueprints have correct URL prefixes"""
        app = create_app()

        # Check config blueprint
        config_bp = app.blueprints.get("config")
        self.assertIsNotNone(config_bp)
        if config_bp is not None:  # Type guard for mypy
            self.assertEqual(config_bp.url_prefix, "/api/config")

        # Check game blueprint
        game_bp = app.blueprints.get("game")
        self.assertIsNotNone(game_bp)
        if game_bp is not None:  # Type guard for mypy
            self.assertEqual(game_bp.url_prefix, "/api")

    def test_app_cors_headers(self) -> None:
        """Test that CORS headers are properly configured"""
        app = create_app()

        with app.test_client() as client:
            response = client.get("/api/config/")

            # Check CORS headers
            self.assertIn("Access-Control-Allow-Origin", response.headers)
            self.assertEqual(
                response.headers["Access-Control-Allow-Origin"], "http://localhost:3000"
            )

            # Check other CORS headers that are actually set
            self.assertIn("Access-Control-Allow-Credentials", response.headers)
            self.assertEqual(response.headers["Access-Control-Allow-Credentials"], "true")
            self.assertIn("Access-Control-Expose-Headers", response.headers)


if __name__ == "__main__":
    unittest.main()
