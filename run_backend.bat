@echo off
setlocal
cd /d "%~dp0"

echo ======================================================================
echo Starting JalRakshak Bihar - Backend Server
echo ======================================================================

if exist "venv\Scripts\activate.bat" (
    echo Activating Python Virtual Environment...
    call "venv\Scripts\activate.bat"
)

set PYTHONPATH=%cd%\backend;%PYTHONPATH%

echo Running ML Model Ingestion & Verification...
python -m app.ml.train_model

echo Seeding Hydrological & Operational Telemetry...
python -m app.database.seed_data

echo Launching FastAPI Server on http://127.0.0.1:8002...
python -m uvicorn app.main:app --host 127.0.0.1 --port 8002 --reload

pause
