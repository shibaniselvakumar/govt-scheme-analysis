# Complete Setup Guide

## ⚡ Quick Setup (AUTOMATED)

### Prerequisites Installation (One-Time)

Before running the automation script, manually install these:

1. **PostgreSQL**
   - Download: https://www.postgresql.org/download/windows/
   - Username: `postgres` (default)
   - Password: 
   - Port: `5432`
   - ✓ Ensure service is running

2. **MongoDB**
   - Download: https://www.mongodb.com/try/download/community
   - Install as Service
   - ✓ Ensure service is running on port 27017

3. **Tesseract OCR**
   - Download: https://github.com/UB-Mannheim/tesseract/wiki
   - Install to: `C:\Program Files\Tesseract-OCR`
   - Select English language data during install

4. **Node.js**
   - Download: https://nodejs.org/ (LTS)
   - Install with defaults

### Run Automated Setup

**Option 1: Batch Script (Easiest for Windows)**

```bash
setup.bat
```

**Option 2: Python Script**

```bash
python setup.py
```

This will:

- ✓ Create Python virtual environment
- ✓ Install all dependencies
- ✓ Create PostgreSQL database
- ✓ Populate MongoDB with scheme data
- ✓ Generate embeddings
- ✓ Build FAISS indexes

---

## 🚀 Starting the Application (After Setup)

### Method 1: Quick Start Scripts

Open two terminal windows:

**Terminal 1 - Backend:**

```bash
cd backend
run_backend.bat
```

**Terminal 2 - Frontend:**

```bash
cd frontend
run_frontend.bat
```

### Method 2: Manual Start

Open two terminal windows:

**Terminal 1 - Backend:**

```bash
cd backend
# Activate venv (if not already active)
..\venv\Scripts\activate
python app.py
```

**Terminal 2 - Frontend:**

```bash
cd frontend
npm run dev
```

### Access Application

Open your browser and navigate to: **`http://localhost:3000`**

---

## 📋 Full Manual Setup (If Automation Fails)

### Step 1: Virtual Environment Setup

```bash
python -m venv venv
venv\Scripts\activate
```

### Step 2: Install Dependencies

```bash
pip install -r requirements.txt
```

### Step 3: Create PostgreSQL Database

```bash
psql -U postgres -c "CREATE DATABASE schemes_users;"
```

### Step 4: Initialize Data (Run from root directory)

```bash
cd others
python database_creation.py
python embed_schemes.py
python build_faiss.py
cd ..
```

### Step 5: Start Backend (Terminal 1)

```bash
cd backend
python app.py
```

### Step 6: Start Frontend (Terminal 2)

```bash
cd frontend
npm install  # Only needed first time
npm run dev
```

### Step 7: Access Application

Open: `http://localhost:3000`
