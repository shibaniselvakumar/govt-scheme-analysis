# Quick Setup Guide

## Step 1: Backend Setup

1. Open a terminal and navigate to the backend directory:
```bash
cd backend
```

2. Activate your virtual environment (if using one):
```bash
# Windows
venv\Scripts\activate

# Linux/Mac
source venv/bin/activate
```

3. Install backend dependencies:
```bash
pip install -r requirements.txt
```

4. Make sure MongoDB is running on `localhost:27017` with your schemes database populated.

5. Start the Flask server:
```bash
python app.py
```

You should see: "Starting Flask server..." and the server running on `http://localhost:5000`

## Step 2: Frontend Setup

1. Open a NEW terminal window and navigate to the frontend directory:
```bash
cd frontend
```

2. Install frontend dependencies:
```bash
npm install
```

3. Start the development server:
```bash
npm run dev
```

You should see the Vite server running on `http://localhost:3000`

## Step 3: Access the Application

Open your browser and navigate to: `http://localhost:3000`

## Troubleshooting

### Backend Issues

- **MongoDB Connection Error**: Make sure MongoDB is running
  ```bash
  # Check if MongoDB is running
  mongosh
  ```

- **FAISS Index Not Found**: Make sure you have generated FAISS indexes in the `faiss_indexes/` folder

- **LLM Model Not Found**: Ensure the Phi-3.5 model is in the `models/` directory

### Frontend Issues

- **Port Already in Use**: Change the port in `vite.config.js` or kill the process using port 3000

- **API Connection Error**: Make sure the backend is running on port 5000 and CORS is enabled

### Common Fixes

1. **Clear node_modules and reinstall**:
```bash
cd frontend
rm -rf node_modules package-lock.json
npm install
```

2. **Clear Python cache**:
```bash
cd backend
find . -type d -name __pycache__ -exec rm -r {} +
```

3. **Check MongoDB connection**:
```python
from pymongo import MongoClient
client = MongoClient("mongodb://localhost:27017/")
db = client["policy_db"]
print(db.list_collection_names())
```

## Development Tips

- The backend uses hot-reload by default (Flask debug mode)
- The frontend uses Vite's HMR (Hot Module Replacement) for instant updates
- Check browser console for frontend errors
- Check terminal for backend errors
