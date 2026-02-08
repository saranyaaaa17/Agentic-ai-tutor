export const evaluateAnswer = (
  concept,
  isCorrect,
  learnerState
) => {

  const data = learnerState.concepts[concept];

  data.attempts += 1;

  if (isCorrect) {
    data.correct += 1;
  }

  // Mastery update formula
  data.mastery =
    0.7 * data.mastery +
    0.3 * (data.correct / data.attempts);

  // Level classification
  if (data.mastery < 0.4) return "Beginner";
  if (data.mastery < 0.75) return "Intermediate";

  return "Advanced";
};
