import { api } from "../lib/api";

export const evaluateAnswer = async (question, correctAnswer, studentAnswer, topic = "General", studentLevel = "Intermediate") => {
  try {
    const response = await fetch(api.processAnswer, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ question, correctAnswer, studentAnswer, topic, studentLevel }),
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
