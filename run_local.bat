@echo off
setlocal
cd /d "%~dp0"

echo ======================================================================
echo JalRakshak Bihar: AI Flood Intelligence & Response Platform
echo ======================================================================
echo Frontend Port : 5174 (Avoids port 5173 conflict)
echo Backend Port  : 8002
echo ======================================================================

REM Check virtualenv
if exist "venv\Scripts\activate.bat" (
    echo [1/3] Using Python Virtual Environment (venv)...
) else (
    echo [1/3] Using System Python...
)

REM Launch backend in a separate terminal window
echo [2/3] Launching Backend Server on port 8002...
start "JalRakshak Backend (Port 8002)" cmd /k "%~dp0run_backend.bat"

REM Wait 2 seconds for backend initialization
timeout /t 2 /nobreak >nul

REM Launch frontend in a separate terminal window
echo [3/3] Launching Frontend UI on port 5174...
start "JalRakshak Frontend (Port 5174)" cmd /k "%~dp0run_frontend.bat"

REM Open browser after brief delay
timeout /t 3 /nobreak >nul
echo Opening Command Center Dashboard...
start http://localhost:5174

echo ======================================================================
echo JalRakshak Bihar is running!
echo Access the Command Center Dashboard at: http://localhost:5174
echo Access the Interactive API Docs at   : http://localhost:8002/docs
echo ======================================================================
