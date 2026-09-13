# JalRakshak Bihar - Local Execution Script for PowerShell
$Root = $PSScriptRoot

Write-Host "======================================================================" -ForegroundColor Cyan
Write-Host "JalRakshak Bihar: AI Flood Intelligence & Response Platform" -ForegroundColor Cyan
Write-Host "Frontend Port : 5174 (Avoids port 5173 conflict)" -ForegroundColor Yellow
Write-Host "Backend Port  : 8002" -ForegroundColor Yellow
Write-Host "======================================================================" -ForegroundColor Cyan

# Set environment
$env:PYTHONPATH = "$Root\backend;$env:PYTHONPATH"

# Start Backend Process
Write-Host "[1/2] Launching Backend Server on port 8002..." -ForegroundColor Green
$BackendProcess = Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd '$Root'; if (Test-Path 'venv\Scripts\Activate.ps1') { .\venv\Scripts\Activate.ps1 }; `$env:PYTHONPATH='$Root\backend'; python -m app.ml.train_model; python -m app.database.seed_data; python -m uvicorn app.main:app --host 127.0.0.1 --port 8002 --reload" -PassThru

Start-Sleep -Seconds 2

# Start Frontend Process
Write-Host "[2/2] Launching Frontend UI on port 5174..." -ForegroundColor Green
$FrontendProcess = Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd '$Root\frontend'; npm run dev -- --port 5174 --host 127.0.0.1" -PassThru

Start-Sleep -Seconds 3
Start-Process "http://localhost:5174"

Write-Host "JalRakshak Bihar is running at http://localhost:5174" -ForegroundColor Cyan
Write-Host "API Docs available at http://localhost:8002/docs" -ForegroundColor Cyan
