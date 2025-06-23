#!/bin/bash

# Twilight Struggle Helper - Development Script
# This script starts both the backend and frontend in development mode

set -e  # Exit on any error

echo "🚀 Starting Twilight Struggle Helper in development mode..."

# Check if we're in the right directory
if [ ! -f "frontend/package.json" ] || [ ! -f "backend/app.py" ]; then
    echo "❌ Error: Please run this script from the project root directory"
    exit 1
fi

# Check if Python virtual environment exists
if [ ! -d "venv" ]; then
    echo "📦 Creating Python virtual environment..."
    python3 -m venv venv
fi

# Activate virtual environment
echo "🐍 Activating Python virtual environment..."
source venv/bin/activate

# Install Python dependencies if needed
if [ ! -f "venv/lib/python*/site-packages/flask" ]; then
    echo "📦 Installing Python dependencies..."
    pip install flask flask-cors twilight-log-parser
fi

# Check if Node.js dependencies are installed
if [ ! -d "frontend/node_modules" ]; then
    echo "📦 Installing Node.js dependencies..."
    cd frontend
    npm install
    cd ..
fi

# Function to cleanup on exit
cleanup() {
    echo "🛑 Shutting down development servers..."
    
    # Kill frontend process
    if [ ! -z "$FRONTEND_PID" ]; then
        if kill -0 $FRONTEND_PID 2>/dev/null; then
            kill $FRONTEND_PID 2>/dev/null || true
        fi
    fi
    
    # For backend, let Flask handle its own shutdown gracefully
    # Don't aggressively kill Python processes as it conflicts with the reloader
    echo "✅ Development servers stopped"
    exit 0
}

# Set up signal handlers
trap cleanup SIGINT SIGTERM

# Start frontend server first (in background)
echo "🎨 Starting frontend server on port 3000..."
cd frontend

# Create logs directory if it doesn't exist
mkdir -p ../logs

PORT=3000 npm start > ../logs/frontend.log 2>&1 &
FRONTEND_PID=$!
cd ..

# Wait a moment for frontend to start
sleep 3

echo "✅ Frontend server starting..."

# Start backend server
echo "🔧 Starting backend server on port 5001..."
cd backend
python app.py

# Wait for both processes
echo "🌐 Development servers are running:"
echo "   Backend: http://localhost:5001"
echo "   Frontend: http://localhost:3000"
echo ""
echo "Press Ctrl+C to stop both servers"

# Wait for both processes
wait $BACKEND_PID $FRONTEND_PID 