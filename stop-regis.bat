@echo off
title Regis AI Studio - Stop

echo.
echo  [MATRIX] Zatrzymuje Regis AI Studio...
echo.

:: Zabij procesy Node.js (Vite)
taskkill /f /im node.exe 2>nul
if %errorlevel%==0 (
    echo  [OK] Frontend zatrzymany
) else (
    echo  [--] Frontend nie byl uruchomiony
)

:: Zabij procesy Python
for /f "tokens=2" %%a in ('tasklist /fi "WINDOWTITLE eq [REGIS]*" /fo list ^| find "PID:"') do (
    taskkill /f /pid %%a 2>nul
)

echo  [OK] Backend zatrzymany
echo.
echo  ====================================
echo   REGIS AI STUDIO ZATRZYMANY
echo  ====================================
echo.

timeout /t 3
exit
