# 🚀 Project Launch Instructions

To run the **Agentic AI Tutor** in full working mode, you need to open **two separate terminals** and run the following commands.

### 🟢 Terminal 1: Start the AI Backend (Python)

This powers the AI Agents (Teacher, Evaluator, Strategy).

1. Navigate to the backend folder:

   ```powershell
   cd "backend_python"
   ```

2. Run the server:
   ```powershell
   python main.py
   ```
   _(Wait until you see: "Application startup complete" and "Uvicorn running on http://0.0.0.0:8000")_

---

### 🔵 Terminal 2: Start the Frontend (React)

This launches the user interface.

1. Navigate to the project root (if you are not already there):

   ```powershell
   cd ..
   ```

   _(Or just open a new terminal in the main project folder)_

2. Run the development server:
   ```powershell
   npm run dev
   ```
   _(This will expose the app at http://localhost:5173)_

---

### ✅ Verification

1. Open your browser to **http://localhost:5173**.
2. The AI backend logs will appear in **Terminal 1** as you interact with the app.

