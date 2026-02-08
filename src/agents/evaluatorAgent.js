/**
 * Evaluator Agent
 * Responsibility: Pure function to evaluate answers.
 * No side effects. No access to learner state.
 *
 * @param {string} userAnswer
 * @param {string} correctAnswer
 * @returns {object} { isCorrect, errorType, feedback }
 */
export const evaluateAnswer = (userAnswer, correctAnswer) => {
  if (!userAnswer) {
    return {
      isCorrect: false,
      errorType: "invalid_input",
      feedback: "Please provide an answer."
    };
  }

  // Normalize: trim, lowercase if string
  const normUser = String(userAnswer).trim().toLowerCase();
  const normCorrect = String(correctAnswer).trim().toLowerCase();
  const isCorrect = normUser === normCorrect;

  if (isCorrect) {
    return {
      isCorrect: true,
      errorType: "none",
      feedback: "Correct! Well done."
    };
  } else {
    return {
      isCorrect: false,
      errorType: "conceptual_error", 
      feedback: `Incorrect. The correct answer is: ${correctAnswer}`
    };
  }
};
