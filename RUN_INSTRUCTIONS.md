### 🚀 Quick Start (One-Click)
The easiest way to start both the backend and frontend together:

1. Double-click `run_all.bat` in the project root.
   _This handles the virtual environment, starts the backend on port 8000, and verifies all AI dependencies._

---

### 🟢 Manual Backend Start (Python)
If you prefer to run things separately, follow these steps in your terminal:

1. Start from the project root:
   ```powershell
   .venv\Scripts\python.exe -m uvicorn backend_python.main:app --host 0.0.0.0 --port 8000 --reload
   ```
   _(Alternatively, `cd backend_python` and run `..\.venv\Scripts\python.exe -m uvicorn main:app --host 0.0.0.0 --port 8000 --reload`)_

---

### 🔵 Manual Frontend Start (React)
Open a separate terminal in the project root:

1. Install dependencies (if you haven't yet):
   ```powershell
   npm install
   ```

2. Run the development server:
   ```powershell
   npm run dev
   ```
   _(This will expose the app at http://localhost:5173)_

---

### ✅ Verification
1. Open your browser to **http://localhost:5173**.
2. If you see "⚠️ AI SERVICE OFFLINE," ensure the Python backend terminal is running and says "Application startup complete."


