@echo off
REM Regis AI Studio - Unified Launcher (Batch Wrapper)
REM This script launches the PowerShell launcher

cd /d "%~dp0"
powershell -ExecutionPolicy Bypass -File "%~dp0Regis-Launch.ps1"
