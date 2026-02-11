@echo off
REM Development mode: Docker backend + Local Next.js
REM Best for development - hot reload on frontend

echo ==========================================
echo   ORNL PCINN - Development Mode
echo ==========================================
echo.

REM Check if Docker is running
docker info >nul 2>&1
if %errorlevel% neq 0 (
    echo ERROR: Docker is not running. Please start Docker Desktop first.
    pause
    exit /b 1
)

echo Starting PCINN backend in Docker (background)...
start /B docker-compose up pcinn-backend

echo Waiting for backend to be ready...
timeout /t 5 /nobreak >nul

echo.
echo Starting Next.js frontend (local development)...
echo   - Backend: http://localhost:8000
echo   - Frontend: http://localhost:3000
echo.
npm run dev
