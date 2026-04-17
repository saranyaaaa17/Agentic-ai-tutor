/**
 * Evaluator Agent (Frontend Wrapper)
 * Responsibility: Call the backend API for answer processing (evaluation + gap analysis).
 * 
 * @param {string} question
 * @param {string} correctAnswer
 * @param {string} studentAnswer
 * @param {string} topic
 * @param {string} studentLevel
 * @returns {Promise<object>} { evaluation: {...}, knowledgeGap: {...} }
 */
export const evaluateAnswer = async (question, correctAnswer, studentAnswer, topic = "General", studentLevel = "Intermediate") => {
  try {
    const API_BASE_URL = import.meta.env.VITE_API_URL || (typeof window !== "undefined" && window.location.hostname === "localhost" ? "http://localhost:8000" : "");
    const response = await fetch(`${API_BASE_URL}/api/evaluate`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        question: question,
        correct_answer: correctAnswer,
        user_answer: studentAnswer,
        topic: topic,
        student_profile: { level: studentLevel }
      }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || "Processing failed");
    }

    const data = await response.json();
    
    // For backward compatibility or direct access, we return the full structure.
    // The consumer should now expect { evaluation, knowledgeGap }
    return data; 
  } catch (error) {
    console.error("Processing Error:", error);
    // Fallback
    return {
      evaluation: {
        isCorrect: false,
        score: 0,
        misconceptions: ["Server error"],
        strengths: [],
        feedback: "Unable to process answer."
      },
      knowledgeGap: {
        gapType: "unknown",
        missingConcept: "unknown",
        severity: "unknown",
        foundational: false,
        reasoning: "System error."
      }
    };
  }
};
