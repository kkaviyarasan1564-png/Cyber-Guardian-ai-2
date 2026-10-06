@echo off
echo ========================================================
echo   Launching EduPulse AI Full-Stack Web Platform
echo ========================================================
cd /d "%~dp0"

echo 1. Starting FastAPI Backend Server on http://127.0.0.1:8000 ...
start "EduPulse Backend (FastAPI)" cmd /c "call .venv\Scripts\activate.bat && python -m uvicorn backend.main:app --host 127.0.0.1 --port 8000 --reload"

timeout /t 2 /nobreak >nul

echo 2. Starting React Vite Frontend on http://localhost:5173 ...
start "EduPulse Frontend (React)" cmd /c "cd frontend && npm run dev"

echo.
echo Both servers are starting up!
echo - Backend API Docs: http://127.0.0.1:8000/docs
echo - Web Application: http://localhost:5173
echo.
pause
