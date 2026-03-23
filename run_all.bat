@echo off
rem ------------------------------------------------------------
rem Multi‑Agent AI Tutor – local startup script (Windows)
rem ------------------------------------------------------------

rem Ensure virtual environment is activated (optional)
if exist venv\Scripts\activate.bat (
    call venv\Scripts\activate.bat
) else (
    echo No virtual environment found. Using system Python.
)

rem Start the Unified Multi-Agent Engine
echo Launching AI Tutor Orchestrator (Unified Engine)...
cd backend_python
start "AI Tutor Swarm" python -m uvicorn main:app --host 0.0.0.0 --port 8000

echo.
echo ============================================================
echo AI TUTOR SERVICES LAUNCHED
echo URL: http://127.0.0.1:8000
echo ============================================================
echo.
echo Use Ctrl+C or close the agent window to stop.
pause