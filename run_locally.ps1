$ErrorActionPreference = "Stop"

Write-Host "Checking environment..." -ForegroundColor Cyan

# Check FFmpeg
if (-not (Get-Command ffmpeg -ErrorAction SilentlyContinue)) {
    Write-Warning "FFmpeg not found in PATH! Video merging might fail."
    Write-Warning "Please install FFmpeg or place ffmpeg.exe in the backend folder."
    Write-Host "You can install it via: winget install Gyan.FFmpeg" -ForegroundColor Yellow
    Write-Host "Or download from: https://www.gyan.dev/ffmpeg/builds/" -ForegroundColor Yellow
}

# Start Backend
Write-Host "Starting Backend..." -ForegroundColor Green
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd backend; if (-not (Test-Path venv)) { python -m venv venv }; ./venv/Scripts/Activate.ps1; pip install -r requirements.txt; `$env:AUTH_CODE='123456'; uvicorn main:app --reload --port 8000"

# Start Frontend
Write-Host "Starting Frontend..." -ForegroundColor Green
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd frontend; if (!(Test-Path node_modules)) { npm install }; npm run dev"

Write-Host "Servers starting..." -ForegroundColor Cyan
Write-Host "Frontend will be at: http://localhost:5173"
Write-Host "Backend will be at: http://localhost:8000"
