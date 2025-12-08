#!/bin/bash
# Linux Launcher for Regis AI Studio

# Check for npm
if ! command -v npm &> /dev/null; then
    echo "Error: Node.js (npm) is not installed."
    echo "Please install Node.js from https://nodejs.org/"
    exit 1
fi

echo "Node.js found. Starting..."

# Install dependencies if node_modules doesn't exist
if [ ! -d "node_modules" ]; then
    echo "Installing dependencies..."
    npm install
fi

# Run launcher
npm run launcher
