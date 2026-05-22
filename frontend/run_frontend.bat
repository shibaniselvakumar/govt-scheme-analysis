@echo off
REM ============================================================
REM FRONTEND STARTUP SCRIPT
REM ============================================================
REM Starts the Vite development server on http://localhost:3000
REM ============================================================

echo.
echo ============================================================
echo      CIP FRONTEND SERVER STARTUP
echo ============================================================
echo.

REM Check if node_modules exists
if not exist "node_modules" (
    echo [1/2] Installing dependencies...
    call npm install
    if %errorlevel% neq 0 (
        echo ERROR: npm install failed
        pause
        exit /b 1
    )
    echo ✓ Dependencies installed
) else (
    echo [1/2] Dependencies already installed, skipping npm install
)

REM Start Vite dev server
echo [2/2] Starting Vite development server...
echo.
echo Frontend server starting on http://localhost:3000
echo Backend connection: http://localhost:5000
echo Press Ctrl+C to stop
echo.

call npm run dev

if %errorlevel% neq 0 (
    echo.
    echo ERROR: Frontend server failed to start
    pause
)
