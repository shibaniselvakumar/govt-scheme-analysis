@echo off
REM ============================================================
REM BACKEND STARTUP SCRIPT
REM ============================================================
REM Starts the Flask backend server on http://localhost:5000
REM ============================================================

echo.
echo ============================================================
echo      CIP BACKEND SERVER STARTUP
echo ============================================================
echo.

REM Activate virtual environment
echo [1/2] Activating virtual environment...
call ..\venv\Scripts\activate.bat
echo ✓ Virtual environment activated

REM Start Flask server
echo [2/2] Starting Flask server...
echo.
echo Backend server starting on http://localhost:5000
echo Press Ctrl+C to stop
echo.

python app.py

if %errorlevel% neq 0 (
    echo.
    echo ERROR: Backend server failed to start
    echo Check that MongoDB and PostgreSQL are running
    pause
)
