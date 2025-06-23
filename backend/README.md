# Twilight Helper Backend

A modular Flask backend for the Twilight Struggle Helper application.

## 🏗️ Project Structure

```
backend/
├── src/                    # Main source code
│   ├── __init__.py
│   ├── app.py             # Main Flask application factory
│   ├── api/               # API route modules
│   │   ├── __init__.py
│   │   ├── config_routes.py    # Configuration endpoints
│   │   └── game_routes.py      # Game-related endpoints
│   ├── config/            # Configuration management
│   │   ├── __init__.py
│   │   └── config_manager.py   # Configuration handling
│   ├── models/            # Data models and formatting
│   │   ├── __init__.py
│   │   └── game_data.py        # Game data models and formatters
│   └── utils/             # Utility functions
│       ├── __init__.py
│       └── log_utils.py        # Log file utilities
├── tests/                 # Test suite (mirrors src structure)
│   ├── __init__.py
│   ├── api/               # API route tests
│   │   ├── __init__.py
│   │   ├── test_config_routes.py
│   │   └── test_game_routes.py
│   ├── config/            # Configuration tests
│   │   ├── __init__.py
│   │   └── test_config_manager.py
│   ├── models/            # Model tests
│   │   ├── __init__.py
│   │   └── test_game_data.py
│   ├── utils/             # Utility tests
│   │   ├── __init__.py
│   │   └── test_log_utils.py
│   ├── test_integration.py     # Integration tests
│   ├── test_app_factory.py     # App factory tests
│   └── test_edge_cases.py      # Edge case tests
├── main.py               # Application entry point
├── app.py                # Legacy monolithic app (deprecated)
├── test_app.py           # Legacy tests (deprecated)
├── test_app_modular.py   # Legacy modular tests (deprecated)
├── test_utils.py         # Legacy utility tests (deprecated)
├── requirements.txt      # Python dependencies
└── pytest.ini           # Pytest configuration
```

## 🚀 Quick Start

### Development
```bash
# Install dependencies
pip install -r requirements.txt

# Run the application
python main.py
```

### Testing
```bash
# Run all tests with pytest
pytest

# Run tests with coverage
pytest --cov=src

# Run specific test module
pytest tests/api/test_config_routes.py

# Run tests with verbose output
pytest -v
```

## 📋 API Endpoints

### Configuration Endpoints
- `GET /api/config/` - Get current configuration
- `PUT /api/config/` - Update configuration
- `POST /api/config/reset` - Reset configuration to defaults

### Game Endpoints
- `GET /api/test` - Debug endpoint with system information
- `GET /api/current-status` - Get current game status from log file
- `POST /api/shutdown` - Gracefully shutdown the server

## 🔧 Configuration

The application uses a JSON configuration file stored in platform-specific locations:

- **Windows**: `%APPDATA%/Twilight Struggle Helper/config.json`
- **macOS**: `~/Library/Application Support/Twilight Struggle Helper/config.json`
- **Linux**: `~/.config/Twilight Struggle Helper/config.json`

### Configuration Schema
```json
{
  "log_file_path": null,
  "log_directory": "/path/to/log/directory"
}
```

## 🧪 Testing

The project includes comprehensive tests organized to mirror the source structure:

### Test Organization
- **`tests/api/`** - Tests for API endpoints
- **`tests/config/`** - Tests for configuration management
- **`tests/models/`** - Tests for data models and formatters
- **`tests/utils/`** - Tests for utility functions
- **`tests/test_integration.py`** - Integration tests for complete workflows
- **`tests/test_app_factory.py`** - Tests for Flask app factory and configuration
- **`tests/test_edge_cases.py`** - Tests for edge cases and boundary conditions

### Test Types
- **Unit Tests**: Test individual functions and classes
- **Integration Tests**: Test complete workflows and component interactions
- **API Tests**: Test HTTP endpoints with mocked dependencies
- **Error Handling**: Test error conditions and edge cases
- **Edge Cases**: Test boundary conditions and unusual inputs
- **App Factory**: Test Flask application creation and configuration

### Running Tests
```bash
# Run all tests
pytest

# Run specific test category
pytest tests/api/
pytest tests/config/
pytest tests/models/
pytest tests/utils/

# Run specific test file
pytest tests/api/test_config_routes.py

# Run integration tests
pytest tests/test_integration.py

# Run edge case tests
pytest tests/test_edge_cases.py

# Run with coverage
pytest --cov=src --cov-report=html

# Run with verbose output
pytest -v

# Run tests in parallel (requires pytest-xdist)
pytest -n auto
```

### Test Coverage
The test suite covers:
- ✅ All API endpoints (GET, PUT, POST)
- ✅ Configuration management (load, save, reset, update)
- ✅ Game data formatting and models
- ✅ Log file utilities
- ✅ Error handling and edge cases
- ✅ CORS configuration
- ✅ Flask app factory
- ✅ Integration workflows
- ✅ Concurrent request handling
- ✅ Unicode and special character handling

## 🔄 Migration from Legacy Structure

The backend has been refactored from a monolithic `app.py` into a modular structure:

### Key Changes
1. **Separation of Concerns**: Configuration, API routes, and utilities are now in separate modules
2. **Blueprint Architecture**: API routes use Flask blueprints for better organization
3. **Factory Pattern**: Application creation uses a factory function for better testing
4. **Improved Error Handling**: Centralized error response formatting
5. **Better Testing**: Modular structure enables easier unit testing
6. **Organized Tests**: Tests are now organized in a `tests/` directory that mirrors the source structure
7. **Comprehensive Coverage**: Added integration, edge case, and app factory tests

### Migration Guide
- **Legacy Entry Point**: `python app.py` (still works but deprecated)
- **New Entry Point**: `python main.py` (recommended)
- **Legacy Tests**: `test_app.py`, `test_app_modular.py`, `test_utils.py` (deprecated)
- **New Tests**: `tests/` directory (recommended)

## 🛠️ Development

### Adding New Endpoints
1. Create a new route file in `src/api/`
2. Define a Flask blueprint
3. Register the blueprint in `src/app.py`
4. Add tests in `tests/api/`

### Adding New Utilities
1. Create a new module in `src/utils/`
2. Import and use in the appropriate route or service
3. Add tests in `tests/utils/`

### Configuration Changes
1. Update `src/config/config_manager.py`
2. Update tests in `tests/config/`
3. Update documentation

### Adding New Models
1. Create a new module in `src/models/`
2. Add tests in `tests/models/`

### Adding Integration Tests
1. Add tests to `tests/test_integration.py` for complete workflows
2. Test interactions between multiple components

### Adding Edge Case Tests
1. Add tests to `tests/test_edge_cases.py` for boundary conditions
2. Test error handling and unusual inputs

## 🐛 Troubleshooting

### Common Issues
- **Import Errors**: Ensure `src/` is in the Python path
- **Config File Not Found**: Check platform-specific config directory
- **Log File Not Found**: Verify log directory path in configuration
- **Test Import Errors**: Ensure tests can import from `src/`

### Debug Mode
Enable debug logging by setting the environment variable:
```bash
export DEBUG=1
python main.py
```

## 📝 Contributing

1. Follow the existing code structure and patterns
2. Add tests for new functionality in the appropriate `tests/` subdirectory
3. Add integration tests for complete workflows
4. Add edge case tests for boundary conditions
5. Update documentation as needed
6. Ensure all tests pass before submitting changes
7. Use pytest for running tests 