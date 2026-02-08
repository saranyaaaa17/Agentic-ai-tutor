/**
 * Knowledge Gap Analyzer
 * Responsibility: Pure function to check mastery.
 * No side effects.
 *
 * @param {object} learnerState - { mastery: { [conceptId]: number } }
 * @param {string} conceptId
 * @returns {object} { masteryScore, isWeakConcept }
 */
export const analyzeGap = (learnerState, conceptId) => {
  const masteryScore = (learnerState?.mastery && learnerState.mastery[conceptId]) || 0;
  const GAP_THRESHOLD = 0.5; 

  return {
    conceptId,
    masteryScore,
    isGap: masteryScore < GAP_THRESHOLD,
    reason: masteryScore < GAP_THRESHOLD ? "Mastery below 50%" : "Concept mastered"
  };
};
