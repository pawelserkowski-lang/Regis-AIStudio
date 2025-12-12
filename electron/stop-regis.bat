@echo off
echo Zatrzymuje Regis AI Studio...
taskkill /f /fi "WINDOWTITLE eq REGIS-Backend" >nul 2>&1
taskkill /f /fi "WINDOWTITLE eq REGIS-Frontend" >nul 2>&1
taskkill /f /im node.exe >nul 2>&1
echo Zatrzymano!
timeout /t 2
exit
