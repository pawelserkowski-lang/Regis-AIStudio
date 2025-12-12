@echo off
cd /d "%~dp0"

echo Uruchamiam Regis AI Studio...

:: Uruchom backend
start /min cmd /c "title REGIS-Backend && python api/index.py"
timeout /t 2 /nobreak >nul

:: Uruchom frontend
start /min cmd /c "title REGIS-Frontend && npm run dev"
timeout /t 4 /nobreak >nul

:: Otworz jako aplikacja w Edge (kazdy Windows ma)
start "" "msedge.exe" --app=http://localhost:5173 --window-size=1400,900

exit
