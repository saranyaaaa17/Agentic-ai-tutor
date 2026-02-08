# Agentic AI Tutor

**Agentic AI Tutor** is a next-generation education platform designed to simulate real-world technical interviews and provide personalized learning paths. It leverages an "Agentic" approach to simulate different personas (Teacher, Evaluator, Strategy Agent) to guide users through their preparation journey, whether for top-tier product companies (FAANG) or major service-based firms.

## 🚀 Key Features

### 1. Personalized Learning Paths

- **Adaptive Assessments**: The system evaluates user performance in real-time.
- **Dynamic Curriculum**: Based on the score, users are routed to specific resources:
  - **Foundation**: For beginners needing core concept reinforcement.
  - **Professional**: For intermediate learners focusing on standard interview patterns.
  - **Elite**: For advanced users targeting high-package roles.

### 2. Immersive Exam Simulations

- **Product-Based Companies (Google, Amazon, Meta)**:
  - Focuses on **Data Structures & Algorithms (Hard)** and **System Design**.
  - **Calibration**: Provides a "Hire" / "No Hire" decision based on industry standards.
  - **Resource Mapping**: Directs "No Hire" candidates to rigorous DSA refreshers and "Hire" candidates to Staff-level system design paths.
- **Service-Based Companies (TCS, Infosys, Accenture)**:
  - Focuses on **Aptitude, Logical Reasoning, and Technical Basics**.
  - **Simulations**: Mimics the exam patterns of major mass recruiters.
  - **Tiers**: Categorizes results into Foundation, Professional, or Elite readiness levels.

### 3. Premium User Experience

- **Glassmorphism UI**: A modern, dark-themed aesthetic using semi-transparent layers and background blurs.
- **Interactive Animations**: Powered by **Framer Motion** for smooth transitions and engaging feedback.
- **Gamified Progress**: Visual progress bars, timers, and achievement tiers (e.g., "L5/L6 Ready").

## 🛠 Tech Stack

- **Frontend Framework**: [React 19](https://react.dev/)
- **Build Tool**: [Vite 7](https://vitejs.dev/)
- **Styling**: [Tailwind CSS 4](https://tailwindcss.com/)
- **Animations**: [Framer Motion](https://www.framer.com/motion/)
- **Routing**: [React Router DOM](https://reactrouter.com/)
- **3D Elements**: [React Three Fiber](https://docs.pmnd.rs/react-three-fiber) (ready for expansion)
- **Backend / Auth**: [Supabase](https://supabase.com/) (configured)

## 📂 Project Structure

```bash
src/
├── assessment/           # Core assessment logic and components
│   ├── Assessment.jsx    # Main assessment controller
│   ├── ProductBasedAssessment.jsx  # FAANG simulation logic
│   ├── ServiceBasedAssessment.jsx  # Service company simulation logic
│   ├── ProblemSolvingAssessment.jsx # General coding challenges
│   └── ...
├── components/           # Reusable UI components (Buttons, Cards, etc.)
├── context/              # Global state (AuthContext, etc.)
├── hooks/                # Custom React hooks
├── lib/                  # Configuration files (companyConfig.js)
├── pages/                # Main route pages (Login, Dashboard, Landing)
└── index.css             # Global styles and Tailwind imports
```

## ⚡ Getting Started

### Prerequisites

- Node.js (v18 or higher)
- npm or yarn

### Installation

1.  **Clone the repository**:

    ```bash
    git clone https://github.com/your-username/agentic-ai-tutor.git
    cd agentic-ai-tutor
    ```

2.  **Install dependencies**:

    ```bash
    npm install
    ```

3.  **Run the development server**:

    ```bash
    npm run dev
    ```

4.  **Build for production**:
    ```bash
    npm run build
    ```

## 🔮 Future Roadmap

- **AI Code Review**: Integrate LLMs to provide line-by-line feedback on code submissions.
- **Voice Agent Interviewer**: Add voice-to-text capabilities for a conversational system design interview.
- **Multiplayer Mock Exams**: Allow users to compete in live coding assessments.

---

_Built with ❤️ by the Agentic AI Tutor Team_
