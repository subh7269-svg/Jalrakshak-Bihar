@echo off
setlocal
cd /d "%~dp0\frontend"

echo ======================================================================
echo Starting JalRakshak Bihar - Frontend Command Center
echo Port: 5174 (Avoids conflict with leadforge on 5173)
echo ======================================================================

if not exist "node_modules" (
    echo Installing node dependencies...
    call npm install
)

echo Launching Vite Dev Server on http://localhost:5174...
call npm run dev -- --port 5174 --host 127.0.0.1

pause
