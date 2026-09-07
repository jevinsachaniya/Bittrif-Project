@echo off
chcp 65001 > nul
echo Starting Bittrif Group Website...
echo.

:: Start Backend with UTF-8 forced BEFORE python starts
echo [1/2] Starting Python Backend on http://localhost:8000
start "Bittrif Backend" cmd /k "chcp 65001 > nul && cd /d "%~dp0backend" && set PYTHONUTF8=1 && python -m uvicorn main:app --reload --port 8000"

:: Wait 2 seconds
timeout /t 2 /nobreak > nul

:: Start Frontend
echo [2/2] Starting React Frontend on http://localhost:5173
start "Bittrif Frontend" cmd /k "cd /d "%~dp0client" && npm run dev"

echo.
echo Servers are starting in separate windows.
echo Backend:  http://localhost:8000
echo Frontend: http://localhost:5173
echo Admin:    http://localhost:5173/admin
echo.
pause
