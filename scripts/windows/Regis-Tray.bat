@echo off
cd /d "%~dp0..\.."
powershell -ExecutionPolicy Bypass -WindowStyle Hidden -File "%~dp0..\..\start-tray.ps1"
