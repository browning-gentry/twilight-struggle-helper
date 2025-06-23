@echo off
setlocal EnableDelayedExpansion

echo Current directory: %CD%

echo Cleaning previous builds...
if exist frontend\dist (
    rmdir /s /q frontend\dist
    echo Cleaned frontend\dist
)
if exist backend\dist (
    rmdir /s /q backend\dist
    echo Cleaned backend\dist
)

echo Building backend executable...
cd backend
if not exist "%CD%" (
    echo Failed to change to backend directory
    exit /b 1
)
echo Current directory (backend): %CD%

python -m PyInstaller --onefile ^
    --log-level DEBUG ^
    --hidden-import _socket ^
    --hidden-import binascii ^
    --hidden-import email ^
    --hidden-import email.parser ^
    --hidden-import email.feedparser ^
    --hidden-import email._policybase ^
    --hidden-import email.header ^
    --hidden-import pkg_resources ^
    --hidden-import socket ^
    --hidden-import werkzeug ^
    --hidden-import jinja2 ^
    --hidden-import click ^
    --hidden-import multiprocessing ^
    --hidden-import multiprocessing.context ^
    --hidden-import multiprocessing.reduction ^
    --hidden-import multiprocessing.resource_tracker ^
    --collect-all flask ^
    --collect-all flask_cors ^
    --collect-all werkzeug ^
    --collect-all twilight_log_parser ^
    --clean ^
    app.py

if not exist "dist\app.exe" (
    echo Backend build failed - app.exe not found
    exit /b 1
)
echo Backend built successfully

cd ..
echo Current directory (root): %CD%

echo Setting up backend files...
if not exist "backend\dist\app.exe" (
    echo Backend executable not found at backend\dist\app.exe
    exit /b 1
)
if not exist frontend\backend mkdir frontend\backend
xcopy /y /i backend\dist\app.exe frontend\backend\
if not exist "frontend\backend\app.exe" (
    echo Failed to copy backend executable
    exit /b 1
)
echo Backend files set up successfully

echo Building frontend...
cd frontend
if not exist "%CD%" (
    echo Failed to change to frontend directory
    exit /b 1
)
echo Current directory (frontend): %CD%

echo Installing npm dependencies...
call npm install
if %ERRORLEVEL% neq 0 (
    echo npm install failed
    exit /b 1
)

echo Building electron app...
call npm run electron:build:win
if %ERRORLEVEL% neq 0 (
    echo electron:build:win failed
    exit /b 1
)

if not exist "dist" (
    echo Build completed but dist directory not found
    exit /b 1
)

echo Listing contents of dist directory:
dir dist

echo Build complete! Check frontend\dist for the packaged app. 