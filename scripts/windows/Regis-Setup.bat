@echo off
cd /d "%~dp0..\.."
powershell -ExecutionPolicy Bypass -File "%~dp0..\..\setup.ps1"
