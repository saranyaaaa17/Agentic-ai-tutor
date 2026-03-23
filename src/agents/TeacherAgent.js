import { questionBank } from "../data/questionBank";

const API_URL = "http://localhost:8000/api/teach";

/**
 * Teacher Agent
 * Facade for accessing educational content via AI or Static Question Bank.
 */
export const TeacherAgent = {
  /**
   * Helper to get time limit based on difficulty
   */
  getTimeLimit: (difficulty) => {
    switch(String(difficulty).toLowerCase()) {
      case 'easy': return 45;
      case 'hard': return 180;
      default: return 90; // medium
    }
  },

  /**
   * Get a question from the local static question bank.
   * good for offline or fallback scenarios.
   */
  getStaticQuestion: (conceptId, difficulty) => {
    if (!questionBank[conceptId]) return null;

    const domainQuestions = questionBank[conceptId];
    
    // Filter by difficulty, fallback to all if none found
    let candidates = domainQuestions.filter(q => q.difficulty === difficulty);
    if (candidates.length === 0) candidates = domainQuestions;

    const randomIndex = Math.floor(Math.random() * candidates.length);
    const question = candidates[randomIndex];

    return {
      questionId: question.id,
      conceptId: conceptId,
      difficulty: question.difficulty,
      questionText: question.q,
      options: question.options,
      correctAnswer: question.ans,
      explanation: question.explanation || "Let’s break down this concept step-by-step to build a strong foundation."
    };
  },

  /**
   * Call the AI backend to explain a topic.
   * @param {string} topic 
   * @param {string} difficulty 
   * @param {Array} history - Conversation history
   * @param {Object} studentProfile - Personalization data
   */
  teachConcept: async (topic, difficulty, history = [], studentProfile = {}) => {
    try {
      const res = await fetch(API_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
            topic, 
            difficulty, 
            mode: 'teach', 
            history,
            student_profile: studentProfile 
        })
      });

      if (!res.ok) {
        throw new Error(`Teacher Agent Error: ${res.statusText}`);
      }

      return await res.json();
    } catch (error) {
      console.error("TeacherAgent.teachConcept failed:", error);
      throw error;
    }
  },

  /**
   * Call the AI backend to generate assessment questions.
   * @param {string} topic 
   * @param {string} difficulty 
   * @param {Array<string>} weakConcepts - Optional list of weak concepts to focus on
   * @param {Object} studentProfile - Personalization data
   */
  generateAssessment: async (topic, difficulty, weakConcepts = [], studentProfile = {}, numQuestions = 3) => {
    console.log(`[TeacherAgent] 🤖 Requesting AI Assessment (${numQuestions} questions) for topic: "${topic}"...`);
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 120000); // 120s timeout

      // Anti-Context: inject recent questions from session storage
      let recentQuestions = [];
      try {
          recentQuestions = JSON.parse(sessionStorage.getItem("recent_questions") || "[]");
      } catch (e) {
          console.warn("Could not parse recent questions", e);
      }
      studentProfile = { ...studentProfile, recent_questions: recentQuestions };

      const res = await fetch(API_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
            topic, 
            difficulty, 
            mode: 'assessment',
            num_questions: numQuestions,
            weak_concepts: weakConcepts,
            student_profile: studentProfile
        }),
        signal: controller.signal
      });
      clearTimeout(timeoutId);

      if (!res.ok) {
        throw new Error(`Teacher Agent Error: ${res.statusText}`);
      }

      const data = await res.json();
      console.log(`[TeacherAgent] ✅ Received ${data.questions?.length || 0} questions from AI Backend.`);
      
      // Anti-Context: Update session storage with newly generated questions
      if (data.questions && Array.isArray(data.questions)) {
          const newQTexts = data.questions.map(q => q.q);
          const updatedHistory = [...recentQuestions, ...newQTexts].slice(-15);
          sessionStorage.setItem("recent_questions", JSON.stringify(updatedHistory));
      }

      return data;
    } catch (error) {
      console.error("[TeacherAgent] ❌ AI Generation Failed:", error);

      // For now, simpler to throw and let caller handle or fallback manually
      throw error;
    }
  },

  /**
   * Call the AI backend to analyze knowledge gaps.
   * @param {Array} questions 
   * @param {Object} answers 
   * @param {string} topic 
   */
  analyzeGap: async (questions, answers, topic) => {
    try {
      const res = await fetch("http://localhost:8000/api/gap-analysis", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ questions, answers, topic })
      });

      if (!res.ok) {
        throw new Error(`Teacher Agent Error: ${res.statusText}`);
      }

      return await res.json();
    } catch (error) {
      console.error("[TeacherAgent] ❌ Gap Analysis Failed:", error);
      throw error;
    }
  },

  /**
   * Evaluate a single answer for correctness and feedback.
   */
  evaluateAnswer: async (question, userAnswer, topic, correctAnswer, concepts = []) => {
    try {
      const res = await fetch("http://localhost:8000/api/evaluate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
            question, 
            user_answer: userAnswer, 
            topic,
            correct_answer: correctAnswer,
            concepts: concepts 
        })
      });
      if (!res.ok) throw new Error(`Evaluation Error: ${res.statusText}`);
      return await res.json();
    } catch (error) {
      console.error("Evaluation failed:", error);
      return null;
    }
  },

  /**
   * Deep diagnosis of a specific mistake.
   */
  diagnoseMistake: async (question, userAnswer, evaluatorOutput) => {
    try {
      const res = await fetch("http://localhost:8000/api/diagnose-mistake", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ question, user_answer: userAnswer, evaluator_output: evaluatorOutput })
      });
      if (!res.ok) throw new Error(`Diagnosis Error: ${res.statusText}`);
      return await res.json();
    } catch (error) {
      console.error("Diagnosis failed:", error);
      return null;
    }
  },

  /**
   * Get personalized strategy and course recommendations.
   */
  getStrategy: async (proficiencyLevel, weakConcepts, topic, masteryProfile = {}, metaCognition = 'balanced', learningSpeed = 'medium', confidenceScore = 0.5, engagementScore = 0.8) => {
    try {
      const res = await fetch("http://localhost:8000/api/strategy", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          proficiency_level: proficiencyLevel, 
          weak_concepts: weakConcepts, 
          topic: topic,
          mastery_profile: masteryProfile,
          meta_cognition: metaCognition,
          learning_speed: learningSpeed,
          confidence_score: confidenceScore,
          engagement_score: engagementScore
        })
      });
      if (!res.ok) throw new Error(`Strategy Error: ${res.statusText}`);
      return await res.json();
    } catch (error) {
      console.error("Strategy generation failed:", error);
      return null;
    }
  }
};
