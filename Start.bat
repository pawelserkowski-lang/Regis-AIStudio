@echo off
setlocal EnableDelayedExpansion
title Regis AI Studio - Launcher

:: ============================================================================
:: REGIS AI STUDIO - All-in-One Launcher v4.0.0
:: ============================================================================

cd /d "%~dp0"

cls
echo.
echo   ============================================================
echo.
echo      REGIS AI STUDIO
echo      All-in-One Launcher v4.0.0
echo.
echo   ============================================================
echo.

:: ============================================================================
:: STEP 1: CHECK REQUIREMENTS
:: ============================================================================
echo   [STEP 1/6] Checking Requirements...
echo   ------------------------------------------------------------

set "ALL_OK=1"

:: Check Python
echo   Checking Python...
python --version >nul 2>&1
if %ERRORLEVEL% NEQ 0 (
    echo   [X] Python NOT FOUND
    echo       Please install Python from https://python.org
    set "ALL_OK=0"
) else (
    for /f "tokens=*" %%i in ('python --version 2^>^&1') do set "PY_VER=%%i"
    echo   [OK] !PY_VER!
)

:: Check Node.js
echo   Checking Node.js...
node --version >nul 2>&1
if %ERRORLEVEL% NEQ 0 (
    echo   [X] Node.js NOT FOUND
    echo       Please install Node.js from https://nodejs.org
    set "ALL_OK=0"
) else (
    for /f "tokens=*" %%i in ('node --version 2^>^&1') do set "NODE_VER=%%i"
    echo   [OK] Node.js !NODE_VER!
)

:: Check npm
echo   Checking npm...
npm --version >nul 2>&1
if %ERRORLEVEL% NEQ 0 (
    echo   [X] npm NOT FOUND
    set "ALL_OK=0"
) else (
    for /f "tokens=*" %%i in ('npm --version 2^>^&1') do set "NPM_VER=%%i"
    echo   [OK] npm v!NPM_VER!
)

:: Check Backend file
echo   Checking Backend...
if exist "api\index.py" (
    echo   [OK] api/index.py found
) else (
    echo   [X] api/index.py NOT FOUND
    set "ALL_OK=0"
)

:: Check .env file
echo   Checking .env...
if not exist ".env" (
    if exist ".env.example" (
        copy ".env.example" ".env" >nul
        echo   [!] Created .env from .env.example
        echo       Please edit .env and add your API keys!
    ) else (
        echo   [X] .env NOT FOUND
        set "ALL_OK=0"
    )
) else (
    echo   [OK] .env found
)

echo.
if "!ALL_OK!"=="0" (
    echo   [ERROR] Requirements check failed!
    echo   Please fix the issues above and try again.
    echo.
    pause
    exit /b 1
)
echo   All requirements OK!
echo.

:: ============================================================================
:: STEP 2: INSTALL DEPENDENCIES
:: ============================================================================
echo   [STEP 2/6] Installing Dependencies...
echo   ------------------------------------------------------------

:: Python packages
echo   Installing Python packages...
pip install anthropic python-dotenv google-generativeai -q --break-system-packages 2>nul
if %ERRORLEVEL% NEQ 0 (
    pip install anthropic python-dotenv google-generativeai -q 2>nul
)
echo   [OK] Python packages installed

:: Node modules
echo   Checking node_modules...
if not exist "node_modules" (
    echo   Installing npm dependencies (this may take a minute)...
    call npm install --silent 2>nul
    echo   [OK] npm dependencies installed
) else (
    echo   [OK] node_modules exists
)
echo.

:: ============================================================================
:: STEP 3: LOAD API KEYS FROM ENVIRONMENT
:: ============================================================================
echo   [STEP 3/6] Checking API Keys...
echo   ------------------------------------------------------------

if defined ANTHROPIC_API_KEY (
    echo   [OK] ANTHROPIC_API_KEY configured
) else (
    echo   [!] ANTHROPIC_API_KEY not in environment
    echo       Make sure it is set in .env file
)

if defined GOOGLE_API_KEY (
    echo   [OK] GOOGLE_API_KEY configured
) else (
    echo   [!] GOOGLE_API_KEY not set (optional)
)
echo.

:: ============================================================================
:: STEP 4: CLEANUP PORTS
:: ============================================================================
echo   [STEP 4/6] Cleaning Up Ports...
echo   ------------------------------------------------------------

:: Kill processes on ports 5173 and 8000
for /f "tokens=5" %%a in ('netstat -ano ^| findstr :5173 ^| findstr LISTENING 2^>nul') do (
    taskkill /F /PID %%a >nul 2>&1
    echo   [OK] Freed port 5173
)
for /f "tokens=5" %%a in ('netstat -ano ^| findstr :8000 ^| findstr LISTENING 2^>nul') do (
    taskkill /F /PID %%a >nul 2>&1
    echo   [OK] Freed port 8000
)
echo   [OK] Ports cleaned
echo.

:: ============================================================================
:: STEP 5: START SERVERS
:: ============================================================================
echo   [STEP 5/6] Starting Servers...
echo   ------------------------------------------------------------

:: Start Backend
echo   Starting Backend (port 8000)...
start "REGIS-Backend" /MIN cmd /c "cd /d "%~dp0" && python api/index.py"
echo   [OK] Backend started

:: Wait for backend
timeout /t 2 /nobreak >nul

:: Start Frontend
echo   Starting Frontend (port 5173)...
start "REGIS-Frontend" /MIN cmd /c "cd /d "%~dp0" && npm run dev"
echo   [OK] Frontend started

:: Wait for frontend to be ready
echo.
echo   Waiting for frontend to be ready...
set "READY=0"
set "WAIT=0"
:wait_loop
if !WAIT! GEQ 30 goto wait_done
timeout /t 1 /nobreak >nul
curl -s http://localhost:5173 >nul 2>&1
if %ERRORLEVEL% EQU 0 (
    set "READY=1"
    goto wait_done
)
set /a WAIT+=1
<nul set /p "=."
goto wait_loop
:wait_done
echo.

if "!READY!"=="1" (
    echo   [OK] Frontend is ready!
) else (
    echo   [!] Frontend may still be starting...
)
echo.

:: ============================================================================
:: STEP 6: LAUNCH BROWSER
:: ============================================================================
echo   [STEP 6/6] Launching Browser...
echo   ------------------------------------------------------------

:: Find Chrome or Edge
set "BROWSER="
if exist "%ProgramFiles%\Google\Chrome\Application\chrome.exe" (
    set "BROWSER=%ProgramFiles%\Google\Chrome\Application\chrome.exe"
)
if exist "%ProgramFiles(x86)%\Google\Chrome\Application\chrome.exe" (
    set "BROWSER=%ProgramFiles(x86)%\Google\Chrome\Application\chrome.exe"
)
if exist "%LocalAppData%\Google\Chrome\Application\chrome.exe" (
    set "BROWSER=%LocalAppData%\Google\Chrome\Application\chrome.exe"
)
if not defined BROWSER (
    if exist "%ProgramFiles%\Microsoft\Edge\Application\msedge.exe" (
        set "BROWSER=%ProgramFiles%\Microsoft\Edge\Application\msedge.exe"
    )
    if exist "%ProgramFiles(x86)%\Microsoft\Edge\Application\msedge.exe" (
        set "BROWSER=%ProgramFiles(x86)%\Microsoft\Edge\Application\msedge.exe"
    )
)

if defined BROWSER (
    echo   Opening in app mode...
    start "" "!BROWSER!" --app=http://localhost:5173 --window-size=1400,900
) else (
    echo   Opening in default browser...
    start http://localhost:5173
)
echo   [OK] Browser launched
echo.

:: ============================================================================
:: SUCCESS MESSAGE
:: ============================================================================
echo   ============================================================
echo.
echo          REGIS AI STUDIO IS RUNNING!
echo.
echo   ============================================================
echo.
echo   Frontend:  http://localhost:5173
echo   Backend:   http://localhost:8000
echo   Health:    http://localhost:8000/api/health
echo.
echo   Servers are running in minimized windows.
echo   Close this window to keep servers running in background.
echo   To stop: Close the REGIS-Backend and REGIS-Frontend windows.
echo.
echo   ============================================================
echo.

pause
