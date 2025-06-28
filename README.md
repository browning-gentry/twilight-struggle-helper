# Twilight Struggle Helper 🎯

[![Python](https://img.shields.io/badge/Python-3.8+-blue.svg)](https://www.python.org/downloads/)
[![Node.js](https://img.shields.io/badge/Node.js-16+-green.svg)](https://nodejs.org/)
[![React](https://img.shields.io/badge/React-18.2.0-blue.svg)](https://reactjs.org/)
[![Flask](https://img.shields.io/badge/Flask-3.0.2-red.svg)](https://flask.palletsprojects.com/)
[![License](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE)
[![Frontend CI](https://github.com/bennettgentry/twilight-struggle-helper/actions/workflows/frontend-ci.yml/badge.svg)](https://github.com/bennettgentry/twilight-struggle-helper/actions/workflows/frontend-ci.yml)
[![Backend CI](https://github.com/bennettgentry/twilight-struggle-helper/actions/workflows/backend-ci.yml/badge.svg)](https://github.com/bennettgentry/twilight-struggle-helper/actions/workflows/backend-ci.yml)
[![Full CI](https://github.com/bennettgentry/twilight-struggle-helper/actions/workflows/full-ci.yml/badge.svg)](https://github.com/bennettgentry/twilight-struggle-helper/actions/workflows/full-ci.yml)

A modern, real-time card tracking application for the Twilight Struggle board game. Automatically parses game logs and provides an intuitive interface for managing cards, hands, and game state.

This app is an attempt at building something relatively simple, almost entirely vibe-coded. Wanted to see what Cursor could do.

## 📥 Download & Installation

**Step 1: Download the App**
1. Go to the [Releases page](https://github.com/bennettgentry/twilight-struggle-helper/releases)
2. Click on the latest release (the one at the top)
3. Scroll down to "Assets" and click on:
   - **Windows**: `Twilight Struggle Helper Setup.exe`
   - **Mac**: `Twilight Struggle Helper.dmg`
4. Save the file to your Downloads folder

**Step 2: Install the App**
1. Go to your Downloads folder
2. Double-click on `Twilight Struggle Helper Setup.exe`
3. If Windows shows a warning, click "More info" then "Run anyway"
4. Follow the installation wizard (just click "Next" and "Install")
5. The app will be installed to your Start Menu and Desktop

**Step 3: Install the Required Mod**
1. Go to [TSEspionage Mod](https://github.com/xelrach/TSEspionage)
2. Download the latest release ZIP file
3. Extract the ZIP file contents directly into your Twilight Struggle game folder
4. Your Twilight Struggle folder should now have a "TSEspionage" folder inside it

**Step 4: Run the Helper**
1. Start Twilight Struggle and begin a game
2. Open the Twilight Struggle Helper from your Start Menu or Desktop
3. The helper will automatically detect your game and start tracking cards!

**Step 5: Configure Log File Location (Important!)**
1. In the Twilight Struggle Helper app, click the ⚙️ (gear) icon in the top-right corner
2. In the settings popup, click "Browse" next to "Log Directory"
3. Navigate to your Documents folder and look for a "Twilight Struggle" folder
4. Select the folder that contains your game log files and click "Select Folder"
5. Click "Save" in the settings popup
6. The app will automatically use the most recent log file in the directory
7. **Optional**: You can also select a specific log file by clicking "Browse" next to "Log File" if you want to load a particular game

**⚠️ Important Notes:**
- The executable is unsigned (normal for open-source apps)
- Windows may show security warnings - this is expected
- You can safely click "Run anyway" or "More info" → "Run anyway"
- If your antivirus blocks it, add it to your whitelist
- **Make sure to configure the log directory or the app won't work!**

## ✨ Features

- **🔄 Real-time Updates**: Automatically polls game logs for live updates
- **🎴 Card Management**: Drag & drop interface for moving cards between hands and deck
- **📁 Smart File Detection**: Automatically finds the most recent game log file
- **⚙️ Configurable**: Easy setup for different log file locations
- **🎨 Modern UI**: Clean, responsive interface with card sorting and filtering
- **🖥️ Cross-platform**: Works on Windows, macOS, and Linux
- **📱 Electron Support**: Can be packaged as a desktop application

## 🚀 Quick Start

### Prerequisites

- **Node.js** (version 16 or higher)
- **Python** (version 3.8 or higher)
- **npm** (version 8 or higher)

### Running Development Locally

#### macOS/Linux:
```bash
git clone https://github.com/yourusername/twilight-struggle-helper.git
cd twilight-struggle-helper
./dev.sh
```

#### Windows:
```cmd
git clone https://github.com/yourusername/twilight-struggle-helper.git
cd twilight-struggle-helper
dev.bat
```

The development script will automatically:
- ✅ Create Python virtual environment
- ✅ Install all dependencies
- ✅ Start backend server (port 5001)
- ✅ Start frontend server (port 3000)
- ✅ Open the application in your browser

## 🎮 How to Use

1. **Configure Log Directory**: Click the ⚙️ icon to set your Twilight Struggle log file directory
2. **Auto-Detection**: The app automatically finds and loads the most recent game log
3. **Card Management**: 
   - Use the `+` button to add cards from deck to your hand
   - Drag cards between hands (your hand ↔ opponent's hand)
   - Use the `-` button to remove cards from hands
4. **Sorting**: Choose from multiple sorting options (by ops, by name)
5. **Real-time Updates**: The app automatically updates as the game progresses

## 🏗️ Project Structure

```
twilight-struggle-helper/
├── backend/                 # Python Flask backend
│   ├── app.py              # Main Flask application
│   ├── schema.py           # Data schemas
│   ├── requirements.txt    # Python dependencies
│   └── app.spec           # PyInstaller configuration
├── frontend/               # React frontend
│   ├── src/
│   │   ├── components/     # React components
│   │   ├── hooks/         # Custom React hooks
│   │   ├── services/      # API services
│   │   ├── utils/         # Utility functions
│   │   └── types/         # TypeScript definitions
│   ├── public/            # Static files
│   └── package.json       # Frontend dependencies
├── logo/                  # Application logo
├── dev.sh                 # Development script (macOS/Linux)
├── dev.bat                # Development script (Windows)
├── build.sh               # Production build script
└── README.md              # This file
```

## 🔧 Development

### Available Scripts

| Script | Description |
|--------|-------------|
| `./dev.sh` | Start development servers (macOS/Linux) |
| `dev.bat` | Start development servers (Windows) |
| `npm run build` | Build frontend for production |
| `npm run test` | Run frontend tests |

### Development URLs

- **Frontend**: http://localhost:3000
- **Backend API**: http://localhost:5001
- **API Test**: http://localhost:5001/api/test

### Code Quality & Testing

#### Frontend (React/TypeScript)

**Install Dependencies:**
```bash
cd frontend
npm install
```

**Type Checking:**
```bash
npm run type-check
```

**Linting:**
```bash
# Check for linting issues
npm run lint

# Auto-fix linting issues
npm run lint:fix
```

**Formatting:**
```bash
# Format code with Prettier
npm run format

# Check formatting without making changes
npm run format:check
```

**Testing:**
```bash
# Run tests in watch mode
npm run test

# Run tests with coverage
npm run test:coverage

# Run tests once (for CI)
npm test -- --watchAll=false
```

**Run All Quality Checks:**
```bash
npm run check-all
```

#### Backend (Python/Flask)

**Install Dependencies:**
```bash
cd backend
pip install -r requirements.txt
pip install -r requirements-dev.txt
```

**Type Checking:**
```bash
mypy . --ignore-missing-imports
```

**Linting & Formatting:**
```bash
# Check code with Ruff
ruff check .

# Format code with Ruff
ruff format .

# Check formatting without making changes
ruff format --check .
```

**Testing:**
```bash
# Run tests
pytest

# Run tests with coverage
pytest --cov=. --cov-report=term-missing

# Run tests with verbose output
pytest -v

# Run specific test file
pytest test_app.py
```

**Run All Quality Checks:**
```bash
# Type check, lint, and test
mypy . --ignore-missing-imports && ruff check . && ruff format . && pytest
```

### Pre-commit Hooks

The project uses Husky and lint-staged for automatic code quality checks on commit:

- **Frontend**: Automatically runs ESLint and Prettier on staged files
- **Backend**: You can add pre-commit hooks for Ruff and MyPy

### CI/CD Pipeline

The project includes GitHub Actions workflows that automatically run on PRs:

- **Frontend CI**: TypeScript types, ESLint, Prettier, Jest tests
- **Backend CI**: MyPy types, Ruff linting/formatting, Pytest tests
- **Full CI**: Both frontend and backend checks plus integration tests

### Development Workflow

1. **Before starting work:**
   ```bash
   # Frontend
   cd frontend && npm install
   
   # Backend
   cd backend && pip install -r requirements.txt requirements-dev.txt
   ```

2. **During development:**
   ```bash
   # Start development servers
   ./dev.sh  # or dev.bat on Windows
   ```

3. **Before committing:**
   ```bash
   # Frontend
   cd frontend
   npm run check-all
   
   # Backend
   cd backend
   ruff check . && ruff format . && mypy . --ignore-missing-imports && pytest
   ```

4. **Create PR**: The GitHub Actions will automatically run all quality checks

## 🚀 Production Build

### Desktop Application (Electron)

The application can be packaged as a standalone desktop application for Windows, macOS, and Linux.

#### Prerequisites

**For all platforms:**
```bash
cd frontend
npm install
```

**For Windows builds:**
- Windows 10/11 or WSL
- Wine (for cross-platform builds)

**For macOS builds:**
- macOS 10.14+ (for code signing)
- Xcode Command Line Tools

**For Linux builds:**
- Ubuntu 18.04+ or similar
- Required packages: `build-essential`, `libgtk-3-dev`, `libwebkit2gtk-4.0-dev`

#### Building Install Files

**Recommended: Use the automated build script (builds everything):**

**For macOS/Linux:**
```bash
# Build complete application for current platform
./build.sh
```

**For Windows:**
```cmd
# Build complete application for Windows
build.bat
```

#### Build Output

The built applications will be available in:
- **Windows**: `frontend/dist/Twilight Struggle Helper Setup.exe`
- **macOS**: `frontend/dist/Twilight Struggle Helper.dmg`
- **Linux**: `frontend/dist/twilight-struggle-helper.AppImage`



### Build Configuration

#### Electron Configuration

The Electron build is configured in `frontend/package.json` under the `build` section:

- **App ID**: `com.twilightstruggle.helper`
- **Icons**: Located in `frontend/assets/`
- **Backend Integration**: Backend files are included as extra resources

### Distribution

#### Creating Installers

**Windows (NSIS):**
- Configured in `frontend/package.json`
- Creates professional installer with uninstaller
- Includes desktop and start menu shortcuts

**macOS (DMG):**
- Automatically created by electron-builder
- Includes drag-to-install interface

**Linux (AppImage):**
- Self-contained application
- Runs on most Linux distributions
- No installation required

### Troubleshooting Builds

| Issue | Solution |
|-------|----------|
| Build fails on Windows | Install Visual Studio Build Tools |
| macOS build fails | Install Xcode Command Line Tools |
| Linux build fails | Install required system packages |
| App doesn't start | Check backend integration and file paths |
| Large file size | Use `--onefile` for PyInstaller, optimize dependencies |

## 🐛 Troubleshooting

### Common Issues

| Issue | Solution |
|-------|----------|
| Port already in use | Kill existing processes or change ports |
| Python dependencies missing | Run `pip install -r backend/requirements.txt` |
| Node dependencies missing | Run `npm install` in frontend directory |
| Permission denied | Make dev.sh executable: `chmod +x dev.sh` |
| Log file not found | Check configuration in the ⚙️ settings |


## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.
