const genericHintByTopic = (topic = "") => {
  const lower = String(topic).toLowerCase();

  if (lower.includes("array")) {
    return "Trace the index movement carefully before deciding on the final result.";
  }
  if (lower.includes("string")) {
    return "Pay attention to character order, boundaries, and repeated values.";
  }
  if (lower.includes("tree") || lower.includes("graph")) {
    return "Think about traversal order and what information each step must preserve.";
  }
  if (lower.includes("sql") || lower.includes("database")) {
    return "Check whether the task depends on grouping, filtering, or join conditions first.";
  }
  if (lower.includes("aptitude") || lower.includes("quant")) {
    return "Write down the core equation before working through the arithmetic.";
  }
  if (lower.includes("logic")) {
    return "Eliminate impossible cases first, then compare the remaining patterns.";
  }

  return "Break the problem into one small step at a time before choosing your answer.";
};

export const ensureQuestionHints = (questions = [], topic = "") =>
  questions.map((question, index) => ({
    ...question,
    hint:
      question?.hint?.trim() ||
      genericHintByTopic(question?.q || question?.topic || topic || `question ${index + 1}`)
  }));
