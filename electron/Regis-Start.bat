@echo off
cd /d "%~dp0"
title Regis AI Studio

echo.
echo  Uruchamiam Regis AI Studio...
echo.

:: Backend
start /min cmd /c "title REGIS-Backend && python api/index.py"
timeout /t 2 /nobreak >nul

:: Frontend
start /min cmd /c "title REGIS-Frontend && npm run dev"
timeout /t 4 /nobreak >nul

:: Znajdz Chrome
if exist "%ProgramFiles%\Google\Chrome\Application\chrome.exe" (
    start "" "%ProgramFiles%\Google\Chrome\Application\chrome.exe" --app=http://localhost:5173 --window-size=1400,900
    goto :done
)
if exist "%ProgramFiles(x86)%\Google\Chrome\Application\chrome.exe" (
    start "" "%ProgramFiles(x86)%\Google\Chrome\Application\chrome.exe" --app=http://localhost:5173 --window-size=1400,900
    goto :done
)
if exist "%LocalAppData%\Google\Chrome\Application\chrome.exe" (
    start "" "%LocalAppData%\Google\Chrome\Application\chrome.exe" --app=http://localhost:5173 --window-size=1400,900
    goto :done
)

:: Znajdz Edge
if exist "%ProgramFiles%\Microsoft\Edge\Application\msedge.exe" (
    start "" "%ProgramFiles%\Microsoft\Edge\Application\msedge.exe" --app=http://localhost:5173 --window-size=1400,900
    goto :done
)
if exist "%ProgramFiles(x86)%\Microsoft\Edge\Application\msedge.exe" (
    start "" "%ProgramFiles(x86)%\Microsoft\Edge\Application\msedge.exe" --app=http://localhost:5173 --window-size=1400,900
    goto :done
)

:: Fallback
start http://localhost:5173

:done
echo  Gotowe!
timeout /t 2 /nobreak >nul
exit
