@echo off
REM Start backend in Docker and frontend locally

docker compose up --build -d pcinn-backend
npm run dev
