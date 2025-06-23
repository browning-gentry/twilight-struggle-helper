#!/bin/bash

# Twilight Struggle Helper - Complete Build Script
# This script builds the backend, frontend, and packages everything into a macOS executable

set -e  # Exit on any error

echo "🚀 Starting complete build process..."

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to print colored output
print_status() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Check if we're in the right directory
if [ ! -f "package.json" ] || [ ! -d "backend" ] || [ ! -d "frontend" ]; then
    print_error "This script must be run from the project root directory"
    exit 1
fi

# Step 1: Build the backend
print_status "Building backend executable..."
cd backend

# Clean previous builds
if [ -d "build" ]; then
    rm -rf build
fi
if [ -d "dist" ]; then
    rm -rf dist
fi

# Get Python library path based on environment
if [[ "$OSTYPE" == "darwin"* ]]; then
    # For macOS, check if using Conda
    if [[ -n "$CONDA_PREFIX" ]]; then
        PYTHON_LIB="$CONDA_PREFIX/lib/libpython3.12.dylib"
    else
        # Try to find system Python lib
        PYTHON_LIB=$(python3 -c "import sysconfig; print(sysconfig.get_config_var('LIBDIR'))")/libpython3.12.dylib
    fi
    
    if [[ ! -f "$PYTHON_LIB" ]]; then
        echo "Warning: Could not find Python library at $PYTHON_LIB"
        PYTHON_LIB=""
    fi
fi

# Platform-specific PyInstaller settings
if [[ "$OSTYPE" == "darwin"* ]]; then
    # macOS build
    pyinstaller --onefile \
        --log-level DEBUG \
        --hidden-import _socket \
        --hidden-import binascii \
        --hidden-import email \
        --hidden-import email.parser \
        --hidden-import email.feedparser \
        --hidden-import email._policybase \
        --hidden-import email.header \
        --hidden-import pkg_resources \
        --hidden-import socket \
        --hidden-import werkzeug \
        --hidden-import jinja2 \
        --hidden-import click \
        --hidden-import multiprocessing \
        --hidden-import multiprocessing.context \
        --hidden-import multiprocessing.reduction \
        --hidden-import multiprocessing.resource_tracker \
        --collect-all flask \
        --collect-all flask_cors \
        --collect-all werkzeug \
        --collect-all twilight_log_parser \
        --clean \
        ${PYTHON_LIB:+--add-binary "$PYTHON_LIB:."} \
        --strip \
        app.py
    
    # Also build Windows version if we're building for Windows
    if [[ "$1" == "--windows" || "$1" == "-w" ]]; then
        echo "Building Windows backend executable..."
        # Use wine or cross-compilation if available
        if command -v wine &> /dev/null; then
            # Build Windows executable using wine
            wine python -m PyInstaller --onefile \
                --log-level DEBUG \
                --hidden-import _socket \
                --hidden-import binascii \
                --hidden-import email \
                --hidden-import email.parser \
                --hidden-import email.feedparser \
                --hidden-import email._policybase \
                --hidden-import email.header \
                --hidden-import pkg_resources \
                --hidden-import socket \
                --hidden-import werkzeug \
                --hidden-import jinja2 \
                --hidden-import click \
                --hidden-import multiprocessing \
                --hidden-import multiprocessing.context \
                --hidden-import multiprocessing.reduction \
                --hidden-import multiprocessing.resource_tracker \
                --collect-all flask \
                --collect-all flask_cors \
                --collect-all werkzeug \
                --collect-all twilight_log_parser \
                --clean \
                --strip \
                app.py
        else
            echo "Warning: wine not available, cannot build Windows backend on macOS"
            echo "Creating placeholder Windows executable..."
            # Create a placeholder that will be replaced by the actual Windows build
            cp dist/app dist/app.exe
        fi
    fi
else
    # Windows build
    python -m PyInstaller --onefile \
        --log-level DEBUG \
        --hidden-import _socket \
        --hidden-import binascii \
        --hidden-import email \
        --hidden-import email.parser \
        --hidden-import email.feedparser \
        --hidden-import email._policybase \
        --hidden-import email.header \
        --hidden-import pkg_resources \
        --hidden-import socket \
        --hidden-import werkzeug \
        --hidden-import jinja2 \
        --hidden-import click \
        --hidden-import multiprocessing \
        --hidden-import multiprocessing.context \
        --hidden-import multiprocessing.reduction \
        --hidden-import multiprocessing.resource_tracker \
        --collect-all flask \
        --collect-all flask_cors \
        --collect-all werkzeug \
        --collect-all twilight_log_parser \
        --clean \
        --strip \
        app.py
fi

if [ ! -f "dist/app" ]; then
    print_error "Backend build failed - executable not found"
    exit 1
fi

print_success "Backend built successfully"
cd ..

# Step 2: Build the frontend
print_status "Building frontend..."
cd frontend

# Install dependencies if needed
if [ ! -d "node_modules" ]; then
    print_status "Installing frontend dependencies..."
    npm install
fi

# Build React app
npm run build

if [ ! -d "build" ]; then
    print_error "Frontend build failed - build directory not found"
    exit 1
fi

print_success "Frontend built successfully"
cd ..

# Step 3: Copy backend to frontend build directory
print_status "Copying backend to frontend build directory..."
mkdir -p frontend/build/backend
cp backend/dist/app frontend/build/backend/

# Step 4: Copy electron.js to build directory
print_status "Copying electron.js to build directory..."
cp frontend/public/electron.js frontend/build/

# Step 5: Build the macOS executable
print_status "Building macOS executable..."
cd frontend

# Install electron-builder if not already installed
if ! npm list electron-builder > /dev/null 2>&1; then
    print_status "Installing electron-builder..."
    npm install --save-dev electron-builder
fi

# Build the macOS app
npm run electron:build:mac

cd ..

# Check if the build was successful
if [ -f "frontend/dist/twilight-struggle-helper-1.0.0.dmg" ]; then
    print_success "🎉 Complete build successful!"
    print_success "macOS executable: frontend/dist/twilight-struggle-helper-1.0.0.dmg"
    print_success "App bundle: frontend/dist/mac-arm64/twilight-struggle-helper.app"
else
    print_error "Build failed - executable not found"
    exit 1
fi

echo ""
print_success "Build process completed successfully!"
print_status "You can now run the app by opening: frontend/dist/mac-arm64/twilight-struggle-helper.app"
print_status "Or distribute the DMG file: frontend/dist/twilight-struggle-helper-1.0.0.dmg" 