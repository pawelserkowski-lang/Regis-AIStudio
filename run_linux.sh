#!/bin/bash
# Linux Launcher for Regis AI Studio

# Check for npm
if ! command -v npm &> /dev/null; then
    echo "Error: Node.js (npm) is not installed."
    echo "Please install Node.js from https://nodejs.org/"
    exit 1
fi

# Check for python3
if ! command -v python3 &> /dev/null; then
    echo "Error: Python 3 is not installed."
    echo "Please install Python 3."
    exit 1
fi

echo "Node.js and Python 3 found. Starting..."

# Install dependencies if node_modules doesn't exist
if [ ! -d "node_modules" ]; then
    echo "Installing frontend dependencies..."
    npm install
fi

# Install Python dependencies if requirements.txt exists
if [ -f "api/requirements.txt" ]; then
    echo "Installing Python dependencies..."
    python3 -m pip install -r api/requirements.txt
fi

# Start backend in background
echo "Starting backend server..."
python3 api/local_server.py &
BACKEND_PID=$!

# Function to cleanup background process
cleanup() {
    echo "Stopping backend server..."
    kill $BACKEND_PID 2>/dev/null
}

# Trap exit signals to ensure cleanup
trap cleanup EXIT INT TERM

# Run launcher (frontend)
echo "Starting frontend..."
npm run launcher
