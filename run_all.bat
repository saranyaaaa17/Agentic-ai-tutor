@echo off
rem ------------------------------------------------------------
rem Multi‑Agent AI Tutor – local startup script (Windows)
rem ------------------------------------------------------------

rem Ensure virtual environment is activated
if exist .venv\Scripts\activate.bat (
    echo [INFO] Activating .venv...
    call .venv\Scripts\activate.bat
) else if exist venv\Scripts\activate.bat (
    echo [INFO] Activating venv...
    call venv\Scripts\activate.bat
) else (
    echo [WARN] No virtual environment found. Using system Python.
    echo [TIP] If this fails, run: python -m venv .venv && .venv\Scripts\activate && pip install -r backend_python/requirements.txt
)

rem Start the Unified Multi-Agent Engine
echo Launching AI Tutor Orchestrator (Unified Engine)...
cd backend_python

rem Verify critical dependencies
python -c "import groq, openai" 2>nul
if %errorlevel% neq 0 (
    echo "[ERROR] Critical dependencies (groq, openai) are missing!"
    echo "[FIX] Run: pip install groq openai python-dotenv fastapi uvicorn"
    pause
    exit /b
)

start "AI Tutor Swarm" python -m uvicorn main:app --host 0.0.0.0 --port 8000 --reload

echo.
echo ============================================================
echo AI TUTOR SERVICES LAUNCHED
echo URL: http://127.0.0.1:8000
echo ============================================================
echo.
echo Use Ctrl+C or close the agent window to stop.
pause