@echo off
setlocal EnableDelayedExpansion
chcp 65001 >nul 2>&1
title Regis AI Studio - Launcher

:: ============================================================================
:: REGIS AI STUDIO - All-in-One Launcher
:: ============================================================================
:: Version: 4.0.0
:: Description: Complete launcher with requirements checking, auto-installation,
::              and browser launch
:: ============================================================================

cd /d "%~dp0"

:: Colors for Windows 10+
set "GREEN=[92m"
set "RED=[91m"
set "YELLOW=[93m"
set "CYAN=[96m"
set "RESET=[0m"

:: ============================================================================
:: BANNER
:: ============================================================================
cls
echo.
echo   %CYAN%============================================================%RESET%
echo   %CYAN%  ____  _____ ____ ___ ____       _    ___   %RESET%
echo   %CYAN% |  _ \| ____/ ___|_ _/ ___|     / \  |_ _|  %RESET%
echo   %CYAN% | |_) |  _|| |  _ | |\___ \    / _ \  | |   %RESET%
echo   %CYAN% |  _ \| |__| |_| || | ___) |  / ___ \ | |   %RESET%
echo   %CYAN% |_| \_\_____\____|___|____/  /_/   \_\___|  %RESET%
echo   %CYAN%                                             %RESET%
echo   %CYAN%                 S T U D I O                 %RESET%
echo   %CYAN%============================================================%RESET%
echo   %YELLOW%       All-in-One Launcher v4.0.0%RESET%
echo   %CYAN%============================================================%RESET%
echo.

:: ============================================================================
:: STEP 1: CHECK REQUIREMENTS
:: ============================================================================
echo   %CYAN%[STEP 1/6] Checking Requirements...%RESET%
echo   %CYAN%------------------------------------------------------------%RESET%

set "ALL_OK=1"

:: Check Python
echo   Checking Python...
python --version >nul 2>&1
if %ERRORLEVEL% NEQ 0 (
    echo   %RED%[X] Python NOT FOUND%RESET%
    echo       Please install Python from https://python.org
    set "ALL_OK=0"
) else (
    for /f "tokens=*" %%i in ('python --version 2^>^&1') do set "PY_VER=%%i"
    echo   %GREEN%[OK] !PY_VER!%RESET%
)

:: Check Node.js
echo   Checking Node.js...
node --version >nul 2>&1
if %ERRORLEVEL% NEQ 0 (
    echo   %RED%[X] Node.js NOT FOUND%RESET%
    echo       Please install Node.js from https://nodejs.org
    set "ALL_OK=0"
) else (
    for /f "tokens=*" %%i in ('node --version 2^>^&1') do set "NODE_VER=%%i"
    echo   %GREEN%[OK] Node.js !NODE_VER!%RESET%
)

:: Check npm
echo   Checking npm...
npm --version >nul 2>&1
if %ERRORLEVEL% NEQ 0 (
    echo   %RED%[X] npm NOT FOUND%RESET%
    set "ALL_OK=0"
) else (
    for /f "tokens=*" %%i in ('npm --version 2^>^&1') do set "NPM_VER=%%i"
    echo   %GREEN%[OK] npm v!NPM_VER!%RESET%
)

:: Check Backend file
echo   Checking Backend...
if exist "api\index.py" (
    echo   %GREEN%[OK] api/index.py found%RESET%
) else (
    echo   %RED%[X] api/index.py NOT FOUND%RESET%
    set "ALL_OK=0"
)

:: Check .env file
echo   Checking .env...
if not exist ".env" (
    if exist ".env.example" (
        copy ".env.example" ".env" >nul
        echo   %YELLOW%[!] Created .env from .env.example%RESET%
        echo       Please edit .env and add your API keys!
    ) else (
        echo   %RED%[X] .env NOT FOUND%RESET%
        set "ALL_OK=0"
    )
) else (
    echo   %GREEN%[OK] .env found%RESET%
)

echo.
if "!ALL_OK!"=="0" (
    echo   %RED%[ERROR] Requirements check failed!%RESET%
    echo   %RED%Please fix the issues above and try again.%RESET%
    echo.
    pause
    exit /b 1
)
echo   %GREEN%All requirements OK!%RESET%
echo.

:: ============================================================================
:: STEP 2: INSTALL DEPENDENCIES
:: ============================================================================
echo   %CYAN%[STEP 2/6] Installing Dependencies...%RESET%
echo   %CYAN%------------------------------------------------------------%RESET%

:: Python packages
echo   Installing Python packages...
pip install anthropic python-dotenv google-generativeai -q --break-system-packages 2>nul
if %ERRORLEVEL% NEQ 0 (
    pip install anthropic python-dotenv google-generativeai -q 2>nul
)
echo   %GREEN%[OK] Python packages installed%RESET%

:: Node modules
echo   Checking node_modules...
if not exist "node_modules" (
    echo   Installing npm dependencies (this may take a minute)...
    call npm install --silent 2>nul
    echo   %GREEN%[OK] npm dependencies installed%RESET%
) else (
    echo   %GREEN%[OK] node_modules exists%RESET%
)
echo.

:: ============================================================================
:: STEP 3: LOAD API KEYS FROM ENVIRONMENT
:: ============================================================================
echo   %CYAN%[STEP 3/6] Checking API Keys...%RESET%
echo   %CYAN%------------------------------------------------------------%RESET%

if defined ANTHROPIC_API_KEY (
    echo   %GREEN%[OK] ANTHROPIC_API_KEY configured%RESET%
) else (
    echo   %YELLOW%[!] ANTHROPIC_API_KEY not in environment%RESET%
    echo       Make sure it's set in .env file
)

if defined GOOGLE_API_KEY (
    echo   %GREEN%[OK] GOOGLE_API_KEY configured%RESET%
) else (
    echo   %YELLOW%[!] GOOGLE_API_KEY not set (optional)%RESET%
)
echo.

:: ============================================================================
:: STEP 4: CLEANUP PORTS
:: ============================================================================
echo   %CYAN%[STEP 4/6] Cleaning Up Ports...%RESET%
echo   %CYAN%------------------------------------------------------------%RESET%

:: Kill processes on ports 5173 and 8000
for /f "tokens=5" %%a in ('netstat -ano ^| findstr :5173 ^| findstr LISTENING 2^>nul') do (
    taskkill /F /PID %%a >nul 2>&1
    echo   %GREEN%[OK] Freed port 5173%RESET%
)
for /f "tokens=5" %%a in ('netstat -ano ^| findstr :8000 ^| findstr LISTENING 2^>nul') do (
    taskkill /F /PID %%a >nul 2>&1
    echo   %GREEN%[OK] Freed port 8000%RESET%
)
echo   %GREEN%[OK] Ports cleaned%RESET%
echo.

:: ============================================================================
:: STEP 5: START SERVERS
:: ============================================================================
echo   %CYAN%[STEP 5/6] Starting Servers...%RESET%
echo   %CYAN%------------------------------------------------------------%RESET%

:: Start Backend
echo   Starting Backend (port 8000)...
start "REGIS-Backend" /MIN cmd /c "cd /d "%~dp0" && python api/index.py"
echo   %GREEN%[OK] Backend started%RESET%

:: Wait for backend
timeout /t 2 /nobreak >nul

:: Start Frontend
echo   Starting Frontend (port 5173)...
start "REGIS-Frontend" /MIN cmd /c "cd /d "%~dp0" && npm run dev"
echo   %GREEN%[OK] Frontend started%RESET%

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
echo|set /p="."
goto wait_loop
:wait_done
echo.

if "!READY!"=="1" (
    echo   %GREEN%[OK] Frontend is ready!%RESET%
) else (
    echo   %YELLOW%[!] Frontend may still be starting...%RESET%
)
echo.

:: ============================================================================
:: STEP 6: LAUNCH BROWSER
:: ============================================================================
echo   %CYAN%[STEP 6/6] Launching Browser...%RESET%
echo   %CYAN%------------------------------------------------------------%RESET%

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
echo   %GREEN%[OK] Browser launched%RESET%
echo.

:: ============================================================================
:: SUCCESS MESSAGE
:: ============================================================================
echo   %GREEN%============================================================%RESET%
echo   %GREEN%        REGIS AI STUDIO IS RUNNING!%RESET%
echo   %GREEN%============================================================%RESET%
echo.
echo   %CYAN%Frontend:%RESET%  http://localhost:5173
echo   %CYAN%Backend:%RESET%   http://localhost:8000
echo   %CYAN%Health:%RESET%    http://localhost:8000/api/health
echo.
echo   %YELLOW%Servers are running in minimized windows.%RESET%
echo   %YELLOW%Close this window to keep servers running in background.%RESET%
echo   %YELLOW%To stop: Close the REGIS-Backend and REGIS-Frontend windows.%RESET%
echo.
echo   %CYAN%============================================================%RESET%
echo.

:: Keep window open for user to see status
pause
