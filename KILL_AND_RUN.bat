@echo off
color 0A
echo ===================================================
echo      REGIS PHOENIX ZOMBIE SLAYER PROTOCOL
echo ===================================================
echo.
echo [1] KILLING OLD PROCESSES...
taskkill /F /IM python.exe /T 2>nul
taskkill /F /IM node.exe /T 2>nul
echo.
echo [2] PROCESSES TERMINATED. STARTING FRESH...
echo.
start /min cmd /k python api/local_server.py
start /min cmd /c npm run dev
echo [3] SYSTEM STARTED.
echo.
echo Waiting 5 seconds for backend to stabilize...
timeout /t 5
start http://localhost:3000
echo.
echo DONE. YOU CAN CLOSE THIS WINDOW.