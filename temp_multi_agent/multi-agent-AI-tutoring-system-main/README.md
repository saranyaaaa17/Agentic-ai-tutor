## 🧠 Multi-Agent AI for Personalized Learning in Diverse Culturally Sensitive Classrooms
📘 Description

This project presents a multi-agent AI tutoring system designed to deliver personalized, inclusive, and culturally adaptive learning experiences.
Leveraging Large Language Models (LLMs) such as GPT-4o and Mistral, combined with Retrieval-Augmented Generation (RAG) and the MANGO cultural dataset, the system models learners’ academic, emotional, and cultural profiles to generate context-aware instructional content.

The framework demonstrates how multi-agent orchestration can enhance personalization, emotional sensitivity, and cultural alignment in AI-driven education — moving beyond traditional cognitive personalization toward holistic learner modeling.

## 🧩 System Architecture

The system is composed of six collaborating agents, each with a distinct role:

| Agent                       | Role                                                               | Key Tools / Features                              |
| --------------------------- | ------------------------------------------------------------------ | ------------------------------------------------- |
| **Profiler Agent**          | Builds structured learner profiles (academic, emotional, cultural) | `Pydantic`, `JSONUpdateTool`, secure file I/O     |
| **JSON Saver Agent**        | Ensures persistent and version-safe profile storage                | Validation & backward compatibility               |
| **Content Generator Agent** | Creates personalized lessons and analogies                         | Markdown + `ImageGenerationTool` (DALL·E 3)       |
| **Cultural Adapter Agent**  | Enhances cultural and emotional relevance                          | `ChromaDB`, `SentenceTransformers`, `RAGTool`     |
| **Evaluator Agent**         | Performs cultural and pedagogical evaluation                       | PRACTICC rubric + LLM-as-a-judge (GPT-4o/Mistral) |
| **PDF Creator Agent**       | Generates professional learning PDFs                               | `mdpdf` formatting                                |



## 🧠 Core Technologies

Framework: CrewAI
 (multi-agent orchestration)

Vector Database: ChromaDB

Embedding Model: SentenceTransformers

LLMs: GPT-4o (OpenAI), Mistral-medium-2505 (Mistral AI)

Cultural Dataset: MANGO (Nguyen et al., 2024, Mango | https://commonsense.scads.ai/mango/)

Evaluation Rubric: PRACTICC (Personalization, Relevance, Accuracy, Clarity, Tone, Inclusivity, Confidence, Cultural Fidelity)

## 📊 Results

GPT-4o achieved 100% across all evaluation metrics (PRACTICC).

Mistral achieved ~97%, performing strongly in relevance and clarity but slightly lower in personalization.

RAG-based grounding significantly reduced hallucinations and improved cultural fidelity.

Demonstrated scalable, ethical, and context-aware AI tutoring across multiple cultural settings.

## 🚀 Future Work

Integrate a Reinforcement Learning Agent for adaptive curriculum planning.

Expand real-world classroom testing for scalability and longitudinal personalization.

Enhance emotional intelligence and multimodal reasoning for richer tutoring dynamics.

## 💡 Key Insights

Multi-agent orchestration enables emergent collaboration among LLMs for complex educational reasoning.

Embedding cultural knowledge bases like MANGO via RAG boosts inclusivity and contextual relevance.

PRACTICC rubric offers a scalable, domain-specific approach for AI content evaluation.

## 🧑‍💻 Author

Mojdeh Ghadami
MSc in Artificial Intelligence & Data Science
University of Hull
Supervisor: Dr. Temitayo Matthew Fagbola
📅 September 2025
