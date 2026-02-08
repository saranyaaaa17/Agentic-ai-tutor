/**
 * Strategy Agent
 * Responsibility: Pure function to decide next step.
 * No side effects.
 *
 * @param {number} masteryScore
 * @param {string} errorType
 * @param {number} consecutiveIncorrect
 * @returns {object} { action, reason }
 */
export const determineStrategy = (masteryScore, errorType, consecutiveIncorrect) => {
  // 1. Intervention for repeated failures
  if (consecutiveIncorrect >= 2) {
    return {
      action: "explanation",
      reason: "Detected repeated errors. Providing explanation to reinforce concept."
    };
  }

  // 2. Adjust Difficulty / Progression
  if (masteryScore >= 0.8) {
    return {
      action: "increase_difficulty",
      reason: "High mastery confirmed. Increasing challenge."
    };
  } else if (masteryScore <= 0.3) {
      if (errorType !== "none") {
           return {
               action: "hint",
               reason: "Low mastery and error detected. Providing hint."
           };
      }
      // If low mastery but got it right (maybe luck?), keep steady
      return {
          action: "maintain",
          reason: "Building foundation."
      };
  }

  // 3. Default Maintenance
  return {
    action: "maintain",
    reason: "Continuing assessment at current level."
  };
};
