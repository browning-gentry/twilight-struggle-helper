import json
import os
import shutil
import sys
import tempfile
import unittest
from unittest.mock import MagicMock, patch

# Add the current directory to the path so we can import app
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from app import app, get_default_log_directory, get_latest_log_file, load_config, save_config


class TestTwilightHelperBackend(unittest.TestCase):
    """Test cases for the Twilight Helper Backend Flask application"""

    def setUp(self) -> None:
        """Set up test fixtures before each test method"""
        self.app = app.test_client()

        # Create a temporary directory for test config files
        self.test_dir = tempfile.mkdtemp()
        self.original_config_file = None

        # Mock the config file path for testing
        with patch('app.CONFIG_FILE', os.path.join(self.test_dir, 'test_config.json')):
            self.test_config_file = os.path.join(self.test_dir, 'test_config.json')

    def tearDown(self) -> None:
        """Clean up after each test method"""
        # Remove temporary directory
        shutil.rmtree(self.test_dir, ignore_errors=True)

    def test_get_config_endpoint(self) -> None:
        """Test GET /api/config endpoint"""
        with patch('app.CONFIG_FILE', self.test_config_file):
            # Test with no existing config file
            response = self.app.get('/api/config')
            self.assertEqual(response.status_code, 200)
            data = json.loads(response.data)
            self.assertTrue(data['success'])
            self.assertIn('config', data)
            self.assertIn('log_file_path', data['config'])
            self.assertIn('log_directory', data['config'])

            # Test with existing config file
            test_config = {
                "log_file_path": "/test/path/log.txt",
                "log_directory": "/test/directory"
            }
            with open(self.test_config_file, 'w') as f:
                json.dump(test_config, f)

            response = self.app.get('/api/config')
            self.assertEqual(response.status_code, 200)
            data = json.loads(response.data)
            self.assertTrue(data['success'])
            self.assertEqual(data['config']['log_file_path'], "/test/path/log.txt")
            self.assertEqual(data['config']['log_directory'], "/test/directory")

    def test_update_config_endpoint(self) -> None:
        """Test PUT /api/config endpoint"""
        with patch('app.CONFIG_FILE', self.test_config_file):
            # Test updating config
            update_data = {
                "log_file_path": "/new/path/log.txt",
                "log_directory": "/new/directory"
            }
            response = self.app.put('/api/config',
                                  data=json.dumps(update_data),
                                  content_type='application/json')
            self.assertEqual(response.status_code, 200)
            data = json.loads(response.data)
            self.assertTrue(data['success'])
            self.assertEqual(data['config']['log_file_path'], "/new/path/log.txt")
            self.assertEqual(data['config']['log_directory'], "/new/directory")

            # Test with invalid JSON
            response = self.app.put('/api/config',
                                  data="invalid json",
                                  content_type='application/json')
            self.assertEqual(response.status_code, 400)
            data = json.loads(response.data)
            self.assertFalse(data['success'])

            # Test with no data
            response = self.app.put('/api/config',
                                  data=json.dumps({}),
                                  content_type='application/json')
            self.assertEqual(response.status_code, 200)
            data = json.loads(response.data)
            self.assertTrue(data['success'])

    def test_reset_config_endpoint(self) -> None:
        """Test POST /api/config/reset endpoint"""
        with patch('app.CONFIG_FILE', self.test_config_file):
            # Create an existing config file
            existing_config = {
                "log_file_path": "/old/path/log.txt",
                "log_directory": "/old/directory"
            }
            with open(self.test_config_file, 'w') as f:
                json.dump(existing_config, f)

            # Test resetting config
            response = self.app.post('/api/config/reset')
            self.assertEqual(response.status_code, 200)
            data = json.loads(response.data)
            self.assertTrue(data['success'])
            self.assertIsNone(data['config']['log_file_path'])
            self.assertIn('log_directory', data['config'])

    def test_test_endpoint(self) -> None:
        """Test GET /api/test endpoint"""
        with patch('app.CONFIG_FILE', self.test_config_file):
            response = self.app.get('/api/test')
            self.assertEqual(response.status_code, 200)
            data = json.loads(response.data)

            # Check that all expected fields are present
            expected_fields = [
                'log_dir_exists', 'log_dir_path', 'platform',
                'userprofile', 'documents_path', 'config_file_path',
                'current_config', 'log_files_found', 'log_files'
            ]
            for field in expected_fields:
                self.assertIn(field, data)

    @patch('app.get_latest_log_file')
    @patch('app.log_parser.LogParser')
    def test_get_current_status_endpoint_success(self, mock_parser_class: MagicMock, mock_get_log_file: MagicMock) -> None:
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

        response = self.app.get('/api/current-status')
        self.assertEqual(response.status_code, 200)
        data = json.loads(response.data)

        self.assertEqual(data['status'], 'ok')
        self.assertEqual(data['filename'], 'game_log.txt')
        self.assertEqual(data['turn'], 1)
        self.assertEqual(len(data['deck']), 2)
        self.assertEqual(len(data['discarded']), 1)
        self.assertEqual(len(data['removed']), 1)
        self.assertEqual(len(data['cards_in_hands']), 2)
        self.assertEqual(data['cards_in_hands'], [])
        self.assertEqual(data['your_hand'], [])
        self.assertEqual(data['opponent_hand'], [])

    @patch('app.get_latest_log_file')
    def test_get_current_status_endpoint_no_log_file(self, mock_get_log_file: MagicMock) -> None:
        """Test GET /api/current-status endpoint when no log file is found"""
        mock_get_log_file.return_value = None

        response = self.app.get('/api/current-status')
        self.assertEqual(response.status_code, 200)
        data = json.loads(response.data)

        self.assertIn('error', data)
        self.assertEqual(data['filename'], None)
        self.assertEqual(data['deck'], [])
        self.assertEqual(data['discarded'], [])
        self.assertEqual(data['removed'], [])
        self.assertEqual(data['cards_in_hands'], [])
        self.assertEqual(data['your_hand'], [])
        self.assertEqual(data['opponent_hand'], [])

    @patch('app.get_latest_log_file')
    @patch('app.log_parser.LogParser')
    def test_get_current_status_endpoint_parser_error(self, mock_parser_class: MagicMock, mock_get_log_file: MagicMock) -> None:
        """Test GET /api/current-status endpoint when parser fails"""
        mock_get_log_file.return_value = "/test/path/game_log.txt"

        mock_parser = MagicMock()
        mock_parser.parse_game_log.return_value = None
        mock_parser_class.return_value = mock_parser

        response = self.app.get('/api/current-status')
        self.assertEqual(response.status_code, 200)
        data = json.loads(response.data)

        self.assertEqual(data['status'], 'no game data')
        self.assertEqual(data['filename'], 'game_log.txt')
        self.assertEqual(data['deck'], [])
        self.assertEqual(data['discarded'], [])
        self.assertEqual(data['removed'], [])
        self.assertEqual(data['cardsInHands'], [])
        self.assertEqual(data['yourHand'], [])
        self.assertEqual(data['opponentHand'], [])

    @patch('app.get_latest_log_file')
    def test_get_current_status_endpoint_configured_file_not_found(self, mock_get_log_file: MagicMock) -> None:
        """Test GET /api/current-status when configured file doesn't exist"""
        with patch('app.load_config') as mock_load_config:
            mock_load_config.return_value = {
                "log_file_path": "missing_file.txt",
                "log_directory": "/test/directory"
            }
            mock_get_log_file.return_value = None

            response = self.app.get('/api/current-status')
            self.assertEqual(response.status_code, 200)
            data = json.loads(response.data)

            self.assertIn('error', data)
            self.assertIn('Configured log file not found', data['error'])
            self.assertEqual(data['filename'], 'missing_file.txt')

    def test_shutdown_endpoint(self) -> None:
        """Test POST /api/shutdown endpoint"""
        response = self.app.post('/api/shutdown')
        self.assertIn(response.status_code, [200, 500])
        data = json.loads(response.data)
        self.assertTrue(
            ("status" in data and data["status"] == "shutting down") or
            ("error" in data and "Werkzeug" in data["error"]) or
            ("error" in data)
        )

    def test_shutdown_endpoint_no_werkzeug(self) -> None:
        """Test POST /api/shutdown endpoint when not running with Werkzeug"""
        response = self.app.post('/api/shutdown')
        self.assertEqual(response.status_code, 500)
        data = json.loads(response.data)
        self.assertIn('error', data)
        self.assertIn('Werkzeug', data['error'])

    def test_load_config_function(self) -> None:
        """Test load_config function"""
        with patch('app.CONFIG_FILE', self.test_config_file):
            # Test loading non-existent config (should return defaults)
            config = load_config()
            self.assertIsNone(config['log_file_path'])
            self.assertIn('log_directory', config)

            # Test loading existing config
            test_config = {
                "log_file_path": "/test/path/log.txt",
                "log_directory": "/test/directory"
            }
            with open(self.test_config_file, 'w') as f:
                json.dump(test_config, f)

            config = load_config()
            self.assertEqual(config['log_file_path'], "/test/path/log.txt")
            self.assertEqual(config['log_directory'], "/test/directory")

    def test_save_config_function(self) -> None:
        """Test save_config function"""
        with patch('app.CONFIG_FILE', self.test_config_file):
            test_config = {
                "log_file_path": "/test/path/log.txt",
                "log_directory": "/test/directory"
            }

            # Test successful save
            result = save_config(test_config)
            self.assertTrue(result)

            # Verify the file was created and contains correct data
            with open(self.test_config_file) as f:
                saved_config = json.load(f)
            self.assertEqual(saved_config, test_config)

    def test_get_default_log_directory_function(self) -> None:
        """Test get_default_log_directory function"""
        directory = get_default_log_directory()
        self.assertIsInstance(directory, str)
        self.assertGreater(len(directory), 0)

    @patch('app.load_config')
    @patch('pathlib.Path')
    def test_get_latest_log_file_function(self, mock_path: MagicMock, mock_load_config: MagicMock) -> None:
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
        mock_path_instance.glob.return_value = [
            MagicMock(stat=lambda: MagicMock(st_mtime=100)),
            MagicMock(stat=lambda: MagicMock(st_mtime=200))
        ]

        result = get_latest_log_file()
        self.assertIsInstance(result, str)

    def test_cors_headers(self) -> None:
        """Test that CORS headers are properly set"""
        response = self.app.get('/api/config')
        self.assertIn('Access-Control-Allow-Origin', response.headers)
        self.assertEqual(response.headers['Access-Control-Allow-Origin'], 'http://localhost:3000')

    def test_error_handling(self) -> None:
        """Test error handling in endpoints"""
        # Test with malformed JSON in PUT request
        response = self.app.put('/api/config',
                              data="invalid json data",
                              content_type='application/json')
        self.assertEqual(response.status_code, 400)

        # Test with missing content type
        response = self.app.put('/api/config',
                              data=json.dumps({"test": "data"}))
        self.assertEqual(response.status_code, 400)

    def test_status_endpoint(self) -> None:
        """Test GET /api/status endpoint"""
        response = self.app.get('/api/status')
        self.assertEqual(response.status_code, 200)
        data = json.loads(response.data)
        self.assertEqual(data['status'], 'ok')


if __name__ == '__main__':
    unittest.main()
