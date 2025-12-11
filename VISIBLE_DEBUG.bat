@echo off
color 0E
echo ===================================================
echo      REGIS DEBUG MODE (NO SECRETS)
echo ===================================================
echo.
echo [1] KILLING OLD ZOMBIES...
taskkill /F /IM python.exe /T 2>nul
taskkill /F /IM node.exe /T 2>nul
echo.
echo [2] STARTING BACKEND (VISIBLE WINDOW)...
echo     Watch the new window for Python errors!
start "Regis Backend DEBUG" cmd /k python api/local_server.py
echo.
echo [3] STARTING FRONTEND...
start "Regis Frontend" cmd /c npm run dev
echo.
echo [4] OPENING BROWSER...
timeout /t 4
start http://localhost:3000
echo.
echo SYSTEM STARTED IN DEBUG MODE.
echo CHECK "debug_crash_log.txt" IF IT FAILS.
pause
