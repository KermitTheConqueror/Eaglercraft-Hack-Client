@echo off
cd /d "%~dp0"

where node >nul 2>nul
if errorlevel 1 (
  echo Node.js is required to run this version.
  echo Install it from https://nodejs.org/ and then run this file again.
  pause
  exit /b 1
)

start "Eaglercraft Server" /min node server.mjs
timeout /t 2 /nobreak >nul
start "" "http://127.0.0.1:8000/"

