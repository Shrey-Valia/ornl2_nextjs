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
docker-compose up

pause
