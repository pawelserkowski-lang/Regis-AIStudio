@echo off
SETLOCAL

echo Starting Regis AI Studio Launcher...

:: Check for Node.js
where npm >nul 2>nul
if %errorlevel% neq 0 (
    echo Error: Node.js is not installed or not in PATH.
    echo Please install Node.js from https://nodejs.org/
    pause
    exit /b 1
)

:: Check for Python
where python >nul 2>nul
if %errorlevel% neq 0 (
    echo Error: Python is not installed or not in PATH.
    echo Please install Python 3.
    pause
    exit /b 1
)

:: Install dependencies if needed
if not exist "node_modules" (
    echo Installing frontend dependencies...
    call npm install
)

:: Install Python dependencies
if exist "api\requirements.txt" (
    echo Installing Python dependencies...
    pip install -r api\requirements.txt
)

:: Start backend in a new window/process
echo Starting backend server...
start "Regis AI Studio Backend" python api/local_server.py

:: Start frontend
echo Starting frontend...
call npm run launcher

echo.
echo Frontend stopped. You may need to manually close the backend window.
pause
