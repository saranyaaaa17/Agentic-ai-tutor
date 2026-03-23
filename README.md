# 🎓 ⚡ Agentic AI Tutor: Next-Gen Learning Node

Welcome to the future of adaptive education. **Agentic AI Tutor** is a production-ready, multi-agent platform designed to provide **staff-level mentorship** at scale. Powered by a collaborative swarm of specialized AI agents and real-time cloud persistence.

---

## 🚀 Key Agentic Features

-   **🧠 Swarm Intelligence**: 7+ specialized agents (Teacher, Evaluator, Strategy, Gap Analyst) collaborating to map your neural profile.
-   **⚡ Live System Feed**: Terminal-style sidebar with "Neural Logs" showing real-time agent activity & strategic decisioning.
-   **📈 Dynamic Skill Projection**: SVG-based Mastery Radar tracking your conceptual depth, practical readiness, and exam consistency.
-   **🌩️ Cloud Mastery Sync**: Real-time persistence using **Supabase** (PostgreSQL) ensuring your progress is cloud-native and resilient.
-   **💬 Socratic Helper**: Global AI assistant available on every page to break down any concept using socratic dialogue.
-   **🛠️ n8n Automation**: Automated lesson planning and resource curation (YouTube/GFG) via high-fidelity workflows.

---

## 🛠️ Deployment Readiness

### 1. Prerequisites
- **Node.js v20.x+** & **Python 3.10+**
- **Supabase Project** (PostgreSQL)
- **Groq API Key** (Llama-3 70B & 8B)
- **n8n Instance** (Cloud or self-hosted)

### 2. Environment Setup
Copy `.env.example` to `.env` and fill in your keys:
```bash
cp .env.example .env
```

### 3. Database Migration
Run the contents of [**`database_schema.sql`**](file:///c:/Users/pothi/Desktop/agentic%20ai%20tutor/database_schema.sql) in your Supabase SQL Editor to enable Mastery Tracking.

### 4. Build & Run
```bash
# Frontend (React + Vite)
npm install
npm run build 🚀
npm run preview

# Backend (FastAPI + Groq)
cd backend_python
pip install -r requirements.txt
python main.py
```

---

## 📂 Architecture Overview

### **Multi-Layer Orchestration**
-   **Frontend**: React 18, Tailwind CSS (Vanilla), Framer Motion (Glassmorphism).
-   **Brain**: FastAPI (Orchestrator) using Groq for zero-latency AI inferences.
-   **Storage**: Supabase (RLS Protected) for persistence.
-   **Automations**: n8n for high-level curation workflows.

For deep documentation on agent logic, refer to:
- [`AGENTIC_JUSTIFICATION.md`](file:///c:/Users/pothi/Desktop/agentic%20ai%20tutor/brain/996dec03-73d1-41ff-80e8-cad8e8409e2b/agentic_justification.md)
- [`PROJECT_BLUEPRINT.md`](file:///c:/Users/pothi/Desktop/agentic%20ai%20tutor/brain/996dec03-73d1-41ff-80e8-cad8e8409e2b/project_blueprint.md)

---

## 🤝 Contributing
Built with ❤️ for **Next-Gen Adaptive Learning** by the Agentic AI Swarm. 🚀
