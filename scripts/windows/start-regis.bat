@echo off
cd /d "%~dp0..\.."

echo.
echo  REGIS AI STUDIO
echo  ================
echo.

if not exist "api\index.py" (
    echo [BLAD] Nie znaleziono api\index.py
    pause
    exit /b 1
)

echo [1/2] Backend...
start /min cmd /k "cd /d "%~dp0..\..\" && title REGIS-Backend && python api/index.py"

timeout /t 2 /nobreak >nul

echo [2/2] Frontend...
start /min cmd /k "cd /d "%~dp0..\..\" && title REGIS-Frontend && npm run dev"

timeout /t 3 /nobreak >nul

echo.
echo  GOTOWE!
echo  http://localhost:5173
echo.

start http://localhost:5173

timeout /t 3
exit
