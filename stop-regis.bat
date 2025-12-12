@echo off
echo Zatrzymuje Regis AI Studio...

:: Zabij procesy po tytule okna
taskkill /f /fi "WINDOWTITLE eq REGIS-Backend" >nul 2>&1
taskkill /f /fi "WINDOWTITLE eq REGIS-Frontend" >nul 2>&1

:: Zabij wszystkie procesy Node
taskkill /f /im node.exe >nul 2>&1

:: Zwolnij porty (PowerShell)
powershell -Command "Get-NetTCPConnection -LocalPort 3000,5173,8000 -ErrorAction SilentlyContinue | ForEach-Object { Stop-Process -Id $_.OwningProcess -Force -ErrorAction SilentlyContinue }" >nul 2>&1

echo Zatrzymano!
timeout /t 2
exit
