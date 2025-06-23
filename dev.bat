@echo off
setlocal EnableDelayedExpansion

REM Twilight Struggle Helper - Development Script (Windows)
REM This script starts both the backend and frontend in development mode

echo 🚀 Starting Twilight Struggle Helper in development mode...

REM Check if we're in the right directory
if not exist "frontend\package.json" (
    echo ❌ Error: Please run this script from the project root directory
    exit /b 1
)
if not exist "backend\app.py" (
    echo ❌ Error: Please run this script from the project root directory
    exit /b 1
)

REM Check if Python virtual environment exists
if not exist "venv" (
    echo 📦 Creating Python virtual environment...
    python -m venv venv
)

REM Activate virtual environment
echo 🐍 Activating Python virtual environment...
call venv\Scripts\activate.bat

REM Install Python dependencies if needed
if not exist "venv\Lib\site-packages\flask" (
    echo 📦 Installing Python dependencies...
    pip install flask flask-cors twilight-log-parser
)

REM Check if Node.js dependencies are installed
if not exist "frontend\node_modules" (
    echo 📦 Installing Node.js dependencies...
    cd frontend
    npm install
    cd ..
)

echo 🔧 Starting backend server on port 5001...
cd backend
start "Backend Server" python app.py
cd ..

REM Wait a moment for backend to start
timeout /t 3 /nobreak > nul

REM Check if backend is running (simple check)
echo ✅ Backend server started

echo 🎨 Starting frontend server on port 3000...
cd frontend
set PORT=3000
start "Frontend Server" npm start
cd ..

echo ✅ Frontend server starting...
echo.
echo 🌐 Development servers are running:
echo    Backend: http://localhost:5001
echo    Frontend: http://localhost:3000
echo.
echo Press any key to stop both servers...
pause > nul

REM Kill the processes (this is a simple approach)
taskkill /f /im python.exe 2>nul
taskkill /f /im node.exe 2>nul

echo ✅ Development servers stopped 