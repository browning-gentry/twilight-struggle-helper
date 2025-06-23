@echo off
echo Cleaning previous builds...
if exist frontend\dist rmdir /s /q frontend\dist
if exist backend\dist rmdir /s /q backend\dist

echo Building backend executable for Windows...
cd backend

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
    --strip ^
    app.py

cd ..

echo Setting up backend files...
if not exist frontend\backend mkdir frontend\backend
copy backend\dist\app.exe frontend\backend\
echo Windows backend executable copied successfully

echo Building frontend...
cd frontend
npm install

echo Building for Windows...
npm run electron:build:win

echo Build complete! Check frontend\dist for the packaged app.
pause 