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

:: Check npm (use call to prevent hanging, skip update check)
echo   Checking npm...
set "NPM_VER="
for /f "tokens=*" %%i in ('call npm --version --no-update-notifier 2^>^&1') do set "NPM_VER=%%i"
if "!NPM_VER!"=="" (
    echo   [X] npm NOT FOUND
    set "ALL_OK=0"
) else (
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

:: Node modules (use goto to avoid if-block parsing issues with npm output)
echo   Checking node_modules...
if exist "node_modules" goto :skip_npm_install
echo   Installing npm dependencies (this may take a minute)...
call npm install --silent --no-update-notifier 2>nul
echo   [OK] npm dependencies installed
goto :npm_done
:skip_npm_install
echo   [OK] node_modules exists
:npm_done
echo.

:: ============================================================================
:: STEP 3: LOAD API KEYS FROM .env FILE
:: ============================================================================
echo   [STEP 3/6] Loading API Keys...
echo   ------------------------------------------------------------

:: Load variables from .env file (only if not already set in Windows environment)
:: Windows environment variables take priority over .env file
if exist ".env" (
    echo   Loading from .env file...
    for /f "usebackq tokens=1,* delims==" %%a in (".env") do (
        set "LINE=%%a"
        if not "!LINE:~0,1!"=="#" (
            if not "!LINE!"=="" (
                :: Only set if variable is not already defined (Windows env takes priority)
                if not defined %%a (
                    set "%%a=%%b"
                ) else (
                    :: Check if current value is empty or a placeholder
                    call :check_and_set "%%a" "%%b"
                )
            )
        )
    )
    echo   [OK] Environment loaded from .env
)
goto :after_env_helpers

:check_and_set
:: Helper to check if existing value is empty/placeholder and needs override
set "VAR_NAME=%~1"
set "NEW_VAL=%~2"
:: Get current value
call set "CUR_VAL=%%!VAR_NAME!%%"
:: If current value is empty, use .env value
if "!CUR_VAL!"=="" set "!VAR_NAME!=!NEW_VAL!"
goto :eof

:after_env_helpers

:: Check ANTHROPIC_API_KEY and show source
if defined ANTHROPIC_API_KEY (
    if not "!ANTHROPIC_API_KEY!"=="your_anthropic_api_key_here" (
        echo   [OK] ANTHROPIC_API_KEY configured
    ) else (
        echo   [!] ANTHROPIC_API_KEY is placeholder - please set real key
        echo       You can set it via Windows Environment Variables or .env file
    )
) else (
    echo   [!] ANTHROPIC_API_KEY not found
    echo       Set via Windows Environment Variables or .env file
)

:: Check GOOGLE_API_KEY
if defined GOOGLE_API_KEY (
    if not "!GOOGLE_API_KEY!"=="your_gemini_api_key_here" (
        echo   [OK] GOOGLE_API_KEY configured
    ) else (
        echo   [!] GOOGLE_API_KEY is placeholder [optional]
    )
) else (
    echo   [!] GOOGLE_API_KEY not set [optional]
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

:: Prepare environment variables for child processes
set "ENV_VARS="
if defined ANTHROPIC_API_KEY set "ENV_VARS=!ENV_VARS! set ANTHROPIC_API_KEY=!ANTHROPIC_API_KEY! &&"
if defined GOOGLE_API_KEY set "ENV_VARS=!ENV_VARS! set GOOGLE_API_KEY=!GOOGLE_API_KEY! &&"
if defined VITE_API_URL set "ENV_VARS=!ENV_VARS! set VITE_API_URL=!VITE_API_URL! &&"
if defined DEFAULT_AI_PROVIDER set "ENV_VARS=!ENV_VARS! set DEFAULT_AI_PROVIDER=!DEFAULT_AI_PROVIDER! &&"

:: Start Backend
echo   Starting Backend (port 8000)...
start "REGIS-Backend" /MIN cmd /c "cd /d "%~dp0" && !ENV_VARS! python api/index.py"
echo   [OK] Backend started

:: Wait for backend
timeout /t 2 /nobreak >nul

:: Start Frontend
echo   Starting Frontend (port 5173)...
start "REGIS-Frontend" /MIN cmd /c "cd /d "%~dp0" && !ENV_VARS! npm run dev --no-update-notifier"
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
