@echo off
REM Start PCINN Backend with Docker

echo ==========================================
echo   ORNL PCINN Backend - Docker Launcher
echo ==========================================
echo.

REM Check if Docker is running
docker info >nul 2>&1
if %errorlevel% neq 0 (
    echo ERROR: Docker is not running. Please start Docker Desktop first.
    pause
    exit /b 1
)

echo Building PCINN backend Docker image...
docker-compose build pcinn-backend

echo.
echo Starting PCINN backend...
docker-compose up pcinn-backend

pause
