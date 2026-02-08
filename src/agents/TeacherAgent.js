import { questionBank } from "../data/questionBank";

/**
 * Teacher Agent
 * Responsibility: Pure function to select questions.
 * No side effects. No state updates.
 *
 * @param {string} conceptId
 * @param {string} difficulty
 * @returns {object|null} Question object
 */
export const getQuestion = (conceptId, difficulty) => {
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
};
