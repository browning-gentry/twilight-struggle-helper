#!/usr/bin/env python3
"""
Main entry point for Twilight Helper Backend
"""

import os
import sys

# Add the src directory to the Python path
sys.path.insert(0, os.path.join(os.path.dirname(__file__), "src"))

import signal

from src.app import app, signal_handler

if __name__ == "__main__":
    # Set up signal handlers for graceful shutdown (important for Windows/Electron)
    signal.signal(signal.SIGINT, signal_handler)
    signal.signal(signal.SIGTERM, signal_handler)

    # Simple Flask startup with auto-reloader
    app.run(host="0.0.0.0", port=5001, debug=True)
