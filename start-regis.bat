@echo off
title Regis AI Studio Launcher

cd /d "%~dp0"

echo.
echo  ====================================
echo   REGIS AI STUDIO - Launcher
echo  ====================================
echo.

:: Sprawdz czy istnieje api/index.py
if not exist "api\index.py" (
    echo [!] Nie znaleziono api/index.py
    echo [!] Upewnij sie, ze jestes w folderze projektu.
    pause
    exit /b 1
)

:: Uruchom Backend Python (zminimalizowany)
echo [1/2] Uruchamiam Backend API...
start /min cmd /c "title [REGIS] Backend API && python api/index.py"

:: Poczekaj 2 sekundy na start backendu
timeout /t 2 /nobreak >nul

:: Uruchom Frontend Vite (zminimalizowany)
echo [2/2] Uruchamiam Frontend...
start /min cmd /c "title [REGIS] Frontend Vite && npm run dev"

:: Poczekaj na start
timeout /t 3 /nobreak >nul

echo.
echo  ====================================
echo   REGIS AI STUDIO URUCHOMIONY!
echo  ====================================
echo.
echo   Frontend: http://localhost:5173
echo   Backend:  http://localhost:8000
echo.
echo   Okna dzialaja w tle (pasek zadan)
echo   Aby zatrzymac: uruchom stop-regis.bat
echo.
echo  ====================================
echo.

:: Otworz przegladarke
timeout /t 2 /nobreak >nul
start http://localhost:5173

echo [i] Mozesz zamknac to okno. Serwery dzialaja w tle.
timeout /t 5
exit
