@echo off
echo %DATE% %TIME% - Starting Regis AI Studio > start_regis.log

where npm >nul 2>nul
if %errorlevel% neq 0 (
    echo %DATE% %TIME% - npm not found in PATH. Checking common locations... >> start_regis.log

    if exist "%ProgramFiles%\nodejs\npm.cmd" (
        echo Found Node.js in %ProgramFiles%\nodejs
        set "PATH=%PATH%;%ProgramFiles%\nodejs"
    ) else if exist "%ProgramFiles(x86)%\nodejs\npm.cmd" (
        echo Found Node.js in %ProgramFiles(x86)%\nodejs
        set "PATH=%PATH%;%ProgramFiles(x86)%\nodejs"
    ) else (
        echo %DATE% %TIME% - Error: npm not found >> start_regis.log
        echo Error: Node.js is not installed or 'npm' is not in your PATH.
        echo Please install Node.js from https://nodejs.org/
        echo.
        pause
        exit /b
    )
)

echo Node.js found. Starting...
echo %DATE% %TIME% - Node.js found, running launcher >> start_regis.log
npm run launcher
if %errorlevel% neq 0 (
    echo %DATE% %TIME% - Error during launcher execution >> start_regis.log
    echo.
    echo An error occurred while running the application.
)
pause
