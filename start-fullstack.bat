@echo off
REM Start Full Stack (Backend + Frontend) with Docker
REM Run this script to start both services

echo ==========================================
echo   ORNL PCINN - Full Stack Docker Launcher
echo ==========================================
echo.

REM Check if Docker is running
docker info >nul 2>&1
if %errorlevel% neq 0 (
    echo ERROR: Docker is not running. Please start Docker Desktop first.
    pause
    exit /b 1
)

echo Building all services...
docker-compose build

echo.
echo Starting all services...
echo   - Backend: http://localhost:8000
echo   - Frontend: http://localhost:3000
echo.

REM Start docker-compose in background
start /B docker-compose up

REM Wait for frontend to be ready
echo Waiting for frontend to be ready...
:wait_loop
timeout /t 3 /nobreak >nul
curl -s -o nul -w "%%{http_code}" http://localhost:3000 | findstr "200" >nul
if %errorlevel% neq 0 (
    echo   Still waiting...
    goto wait_loop
)

echo.
echo All services are ready! Opening browser...
start http://localhost:3000

echo.
echo Press Ctrl+C to stop all services.
pause
