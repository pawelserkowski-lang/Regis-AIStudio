@echo off
title Ustaw klucze API
echo.
echo  ====================================================
echo   Ustaw klucze API w zmiennych srodowiskowych
echo  ====================================================
echo.

set /p ANTHROPIC="ANTHROPIC_API_KEY (sk-ant-...): "
set /p GOOGLE="GOOGLE_API_KEY (AIza...): "

if not "%ANTHROPIC%"=="" (
    setx ANTHROPIC_API_KEY "%ANTHROPIC%"
    echo [OK] ANTHROPIC_API_KEY ustawiony
)

if not "%GOOGLE%"=="" (
    setx GOOGLE_API_KEY "%GOOGLE%"
    echo [OK] GOOGLE_API_KEY ustawiony
)

echo.
echo  Zrestartuj terminal i uruchom Regis-Setup.bat
echo.
pause
