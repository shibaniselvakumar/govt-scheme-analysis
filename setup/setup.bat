@echo off
REM ============================================================
REM CIP PROJECT AUTOMATED SETUP SCRIPT
REM ============================================================
REM This script automates the setup process for the CIP project
REM Prerequisites: PostgreSQL, MongoDB, Tesseract OCR, Node.js
REM ============================================================

echo.
echo ============================================================
echo      CIP PROJECT SETUP - Automated Installation Script
echo ============================================================
echo.

REM Check if prerequisites are installed
echo [1/8] Checking prerequisites...
echo.

REM Check Python
python --version >nul 2>&1
if %errorlevel% neq 0 (
    echo ERROR: Python is not installed or not in PATH
    exit /b 1
)
echo ✓ Python found

REM Check Node.js
node --version >nul 2>&1
if %errorlevel% neq 0 (
    echo ERROR: Node.js is not installed or not in PATH
    exit /b 1
)
echo ✓ Node.js found

REM Check PostgreSQL
psql --version >nul 2>&1
if %errorlevel% neq 0 (
    echo WARNING: PostgreSQL might not be in PATH, but can be installed separately
)
echo ✓ PostgreSQL installation status checked

REM Check MongoDB
where mongod >nul 2>&1
if %errorlevel% neq 0 (
    echo WARNING: MongoDB not in PATH, verify service is running
)
echo ✓ MongoDB status checked

echo.
echo [2/8] Creating Python virtual environment...
if exist venv (
    echo Virtual environment already exists, skipping creation
) else (
    python -m venv venv
    echo ✓ Virtual environment created
)

echo.
echo [3/8] Activating virtual environment...
call venv\Scripts\activate.bat
echo ✓ Virtual environment activated

echo.
echo [4/8] Installing Python dependencies...
pip install -r requirements.txt
if %errorlevel% neq 0 (
    echo ERROR: Failed to install dependencies
    exit /b 1
)
echo ✓ Dependencies installed

echo.
echo [5/8] Creating PostgreSQL database...
REM Create database if it doesn't exist
psql -U postgres -tc "SELECT 1 FROM pg_database WHERE datname = 'schemes_users'" >nul 2>&1
if %errorlevel% equ 0 (
    echo Database 'schemes_users' already exists
) else (
    psql -U postgres -c "CREATE DATABASE schemes_users;" 2>nul
    if %errorlevel% equ 0 (
        echo ✓ Database 'schemes_users' created
    ) else (
        echo WARNING: Could not create PostgreSQL database
        echo Make sure PostgreSQL is running and credentials are correct
    )
)

echo.
echo [6/8] Populating MongoDB with scheme data...
cd others
python database_creation.py
if %errorlevel% neq 0 (
    echo ERROR: Failed to populate database
    cd ..
    exit /b 1
)
echo ✓ Scheme data inserted into MongoDB

echo.
echo [7/8] Generating embeddings...
python embed_schemes.py
if %errorlevel% neq 0 (
    echo ERROR: Failed to generate embeddings
    cd ..
    exit /b 1
)
echo ✓ Embeddings generated

echo.
echo [8/8] Building FAISS indexes...
python build_faiss.py
if %errorlevel% neq 0 (
    echo ERROR: Failed to build FAISS indexes
    cd ..
    exit /b 1
)
echo ✓ FAISS indexes built

cd ..
echo.
echo ============================================================
echo      SETUP COMPLETED SUCCESSFULLY!
echo ============================================================
echo.
echo Next steps:
echo.
echo 1. Open TWO terminal windows
echo.
echo Terminal 1 (Backend):
echo   - Navigate to backend folder: cd backend
echo   - Run: python app.py
echo   - Backend will start on http://localhost:5000
echo.
echo Terminal 2 (Frontend):
echo   - Navigate to frontend folder: cd frontend
echo   - Run: npm run dev
echo   - Frontend will start on http://localhost:3000
echo.
echo 3. Open your browser and go to: http://localhost:3000
echo.
echo ============================================================
echo.
pause
