"""
Tests for log utilities
"""

import os
import shutil
import sys
import tempfile
import unittest
from unittest.mock import MagicMock, patch

# Add the src directory to the path so we can import from the modular structure
sys.path.insert(0, os.path.join(os.path.dirname(os.path.dirname(os.path.dirname(__file__))), 'src'))

from src.utils.log_utils import get_latest_log_file, get_log_directory_info


class TestLogUtils(unittest.TestCase):
    """Test cases for log utilities"""

    def setUp(self):
        """Set up test fixtures before each test method"""
        # Create a temporary directory for test config files
        self.test_dir = tempfile.mkdtemp()

        # Mock the config file path for testing
        with patch('src.config.config_manager.ConfigManager._get_config_file_path') as mock_path:
            mock_path.return_value = os.path.join(self.test_dir, 'test_config.json')

    def tearDown(self):
        """Clean up after each test method"""
        # Remove temporary directory
        shutil.rmtree(self.test_dir, ignore_errors=True)

    @patch('src.config.config_manager.config_manager.load_config')
    @patch('src.utils.log_utils.Path')
    def test_get_latest_log_file_function(self, mock_path, mock_load_config):
        """Test get_latest_log_file function"""
        # Mock config
        mock_load_config.return_value = {
            "log_file_path": None,
            "log_directory": "/test/directory"
        }

        # Mock Path and its methods
        mock_path_instance = MagicMock()
        mock_path.return_value = mock_path_instance
        mock_path_instance.exists.return_value = True

        # Create mock file objects with proper stat method and string conversion
        mock_file1 = MagicMock()
        mock_file1.stat.return_value = MagicMock(st_mtime=100)
        mock_file1.name = "file1.txt"
        mock_file1.__str__ = lambda self: "/test/directory/file1.txt"

        mock_file2 = MagicMock()
        mock_file2.stat.return_value = MagicMock(st_mtime=200)
        mock_file2.name = "file2.txt"
        mock_file2.__str__ = lambda self: "/test/directory/file2.txt"

        mock_path_instance.glob.return_value = [mock_file1, mock_file2]

        result = get_latest_log_file()
        self.assertIsInstance(result, str)
        self.assertIn("file2.txt", result)  # Should return the most recent file

    @patch('src.config.config_manager.config_manager.load_config')
    def test_get_latest_log_file_with_specific_file(self, mock_load_config):
        """Test get_latest_log_file with specific log file configured"""
        # Mock config with specific log file
        mock_load_config.return_value = {
            "log_file_path": "/specific/path/log.txt",
            "log_directory": "/test/directory"
        }

        # Mock os.path.isabs and os.path.exists
        with patch('os.path.isabs', return_value=True):
            with patch('os.path.exists', return_value=True):
                result = get_latest_log_file()
                self.assertEqual(result, "/specific/path/log.txt")

    @patch('src.config.config_manager.config_manager.load_config')
    def test_get_latest_log_file_with_relative_filename(self, mock_load_config):
        """Test get_latest_log_file with relative filename"""
        # Mock config with relative filename
        mock_load_config.return_value = {
            "log_file_path": "relative_log.txt",
            "log_directory": "/test/directory"
        }

        # Mock os.path.isabs and os.path.exists
        with patch('os.path.isabs', return_value=False):
            with patch('os.path.exists', return_value=True):
                with patch('pathlib.Path') as mock_path:
                    mock_path_instance = MagicMock()
                    mock_path.return_value = mock_path_instance
                    mock_path_instance.__truediv__ = lambda self, other: f"{self}/{other}"

                    result = get_latest_log_file()
                    self.assertIn("relative_log.txt", result)

    @patch('src.config.config_manager.config_manager.load_config')
    def test_get_latest_log_file_file_not_found(self, mock_load_config):
        """Test get_latest_log_file when configured file doesn't exist"""
        # Mock config with specific log file
        mock_load_config.return_value = {
            "log_file_path": "/missing/path/log.txt",
            "log_directory": "/test/directory"
        }

        # Mock os.path.isabs and os.path.exists
        with patch('os.path.isabs', return_value=True):
            with patch('os.path.exists', return_value=False):
                result = get_latest_log_file()
                self.assertIsNone(result)

    @patch('src.config.config_manager.config_manager.load_config')
    def test_get_latest_log_file_no_files_in_directory(self, mock_load_config):
        """Test get_latest_log_file when no log files found in directory"""
        # Mock config
        mock_load_config.return_value = {
            "log_file_path": None,
            "log_directory": "/test/directory"
        }

        # Mock Path and its methods
        with patch('pathlib.Path') as mock_path:
            mock_path_instance = MagicMock()
            mock_path.return_value = mock_path_instance
            mock_path_instance.exists.return_value = True
            mock_path_instance.glob.return_value = []  # No files found

            result = get_latest_log_file()
            self.assertIsNone(result)

    @patch('src.config.config_manager.config_manager.load_config')
    def test_get_log_directory_info(self, mock_load_config):
        """Test get_log_directory_info function"""
        # Mock config
        mock_load_config.return_value = {
            "log_file_path": None,
            "log_directory": "/test/directory"
        }

        # Mock Path and its methods
        with patch('src.utils.log_utils.Path') as mock_path:
            mock_path_instance = MagicMock()
            mock_path.return_value = mock_path_instance
            mock_path_instance.exists.return_value = True

            # Create mock file objects
            mock_file1 = MagicMock()
            mock_file1.stat.return_value = MagicMock(st_mtime=100)
            mock_file1.name = "file1.txt"

            mock_file2 = MagicMock()
            mock_file2.stat.return_value = MagicMock(st_mtime=200)
            mock_file2.name = "file2.txt"

            mock_path_instance.glob.return_value = [mock_file1, mock_file2]

            result = get_log_directory_info()

            # Check that all expected fields are present
            expected_fields = [
                'log_dir_exists', 'log_dir_path', 'platform',
                'userprofile', 'documents_path', 'config_file_path',
                'current_config', 'log_files_found', 'log_files'
            ]
            for field in expected_fields:
                self.assertIn(field, result)

            self.assertTrue(result['log_dir_exists'])
            self.assertEqual(result['log_files_found'], 2)
            self.assertEqual(len(result['log_files']), 2)

    @patch('src.utils.log_utils.config_manager.load_config')
    def test_get_log_directory_info_directory_not_exists(self, mock_load_config):
        """Test get_log_directory_info when directory doesn't exist"""
        # Mock config
        mock_load_config.return_value = {
            "log_file_path": None,
            "log_directory": "/test/directory"
        }

        # Mock Path and its methods
        with patch('pathlib.Path') as mock_path:
            mock_path_instance = MagicMock()
            mock_path.return_value = mock_path_instance
            mock_path_instance.exists.return_value = False

            result = get_log_directory_info()

            self.assertFalse(result['log_dir_exists'])
            self.assertEqual(result['log_files_found'], 0)
            self.assertEqual(result['log_files'], [])


if __name__ == '__main__':
    unittest.main()
