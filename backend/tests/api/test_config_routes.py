"""
Tests for configuration API routes
"""

import json
import os
import shutil
import sys
import tempfile
import unittest
from unittest.mock import patch

# Add the src directory to the path so we can import from the modular structure
sys.path.insert(0, os.path.join(os.path.dirname(os.path.dirname(os.path.dirname(__file__))), 'src'))

from src.app import create_app
from src.config.config_manager import ConfigManager


class TestConfigRoutes(unittest.TestCase):
    """Test cases for configuration API routes"""

    def setUp(self):
        """Set up test fixtures before each test method"""
        self.app = create_app()
        self.app.testing = True
        self.client = self.app.test_client()

        # Create a temporary directory for test config files
        self.test_dir = tempfile.mkdtemp()

        # Mock the config file path for testing
        with patch('src.config.config_manager.ConfigManager._get_config_file_path') as mock_path:
            mock_path.return_value = os.path.join(self.test_dir, 'test_config.json')
            self.config_manager = ConfigManager()
            self.test_config_file = self.config_manager.config_file

    def tearDown(self):
        """Clean up after each test method"""
        # Remove temporary directory
        shutil.rmtree(self.test_dir, ignore_errors=True)

    def test_get_config_endpoint(self):
        """Test GET /api/config endpoint"""
        with patch('src.config.config_manager.config_manager._get_config_file_path') as mock_path:
            mock_path.return_value = self.test_config_file
            # Test with no existing config file
            with patch('src.config.config_manager.config_manager.load_config') as mock_load_config:
                # First call: no config file
                mock_load_config.return_value = {
                    "log_file_path": None,
                    "log_directory": "/default/directory"
                }
                response = self.client.get('/api/config/')
                self.assertEqual(response.status_code, 200)
                data = json.loads(response.data)
                self.assertTrue(data['success'])
                self.assertIn('config', data)
                self.assertIn('log_file_path', data['config'])
                self.assertIn('log_directory', data['config'])
                expected_default = "/default/directory"
                actual_default = data['config']['log_directory']
                self.assertTrue(actual_default == expected_default or actual_default.endswith("Twilight Struggle"))

            # Test with existing config file
            test_config = {
                "log_file_path": "/test/path/log.txt",
                "log_directory": "/test/directory"
            }
            with open(self.test_config_file, 'w') as f:
                json.dump(test_config, f)
            with patch('src.config.config_manager.config_manager.load_config') as mock_load_config:
                mock_load_config.return_value = test_config
                response = self.client.get('/api/config/')
                self.assertEqual(response.status_code, 200)
                data = json.loads(response.data)
                self.assertTrue(data['success'])
                self.assertEqual(data['config']['log_file_path'], "/test/path/log.txt")
                self.assertEqual(data['config']['log_directory'], "/test/directory")

    def test_update_config_endpoint(self):
        """Test PUT /api/config endpoint"""
        with patch('src.config.config_manager.ConfigManager._get_config_file_path') as mock_path:
            mock_path.return_value = self.test_config_file

            # Test updating config
            update_data = {
                "log_file_path": "/new/path/log.txt",
                "log_directory": "/new/directory"
            }
            response = self.client.put('/api/config/',
                                     data=json.dumps(update_data),
                                     content_type='application/json')
            self.assertEqual(response.status_code, 200)
            data = json.loads(response.data)
            self.assertTrue(data['success'])
            self.assertEqual(data['config']['log_file_path'], "/new/path/log.txt")
            self.assertEqual(data['config']['log_directory'], "/new/directory")

            # Test with invalid JSON
            response = self.client.put('/api/config/',
                                     data="invalid json",
                                     content_type='application/json')
            self.assertEqual(response.status_code, 400)
            data = json.loads(response.data)
            self.assertFalse(data['success'])

            # Test with no data (should use defaults)
            response = self.client.put('/api/config/',
                                     data=json.dumps({}),
                                     content_type='application/json')
            self.assertEqual(response.status_code, 200)
            data = json.loads(response.data)
            self.assertTrue(data['success'])
            # Should have default values
            self.assertIsNotNone(data['config']['log_directory'])

    def test_reset_config_endpoint(self):
        """Test POST /api/config/reset endpoint"""
        with patch('src.config.config_manager.ConfigManager._get_config_file_path') as mock_path:
            mock_path.return_value = self.test_config_file

            # Create an existing config file
            existing_config = {
                "log_file_path": "/old/path/log.txt",
                "log_directory": "/old/directory"
            }
            with open(self.test_config_file, 'w') as f:
                json.dump(existing_config, f)

            # Test resetting config
            response = self.client.post('/api/config/reset')
            self.assertEqual(response.status_code, 200)
            data = json.loads(response.data)
            self.assertTrue(data['success'])
            self.assertIsNone(data['config']['log_file_path'])
            self.assertIn('log_directory', data['config'])

    def test_cors_headers(self):
        """Test that CORS headers are properly set"""
        response = self.client.get('/api/config/')
        self.assertIn('Access-Control-Allow-Origin', response.headers)
        self.assertEqual(response.headers['Access-Control-Allow-Origin'], 'http://localhost:3000')


if __name__ == '__main__':
    unittest.main()
