import { executeCode } from "./codeExecution";

const normalizeOutput = (value = "") =>
  String(value).replace(/\r\n/g, "\n").trim();

export const evaluateCodingChallenge = async (question, code, language) => {
  const visibleTests = question?.visible_tests || [];
  const hiddenTests = question?.hidden_tests || [];

  const runTests = async (tests, label) => {
    const results = [];
    for (const test of tests) {
      const execution = await executeCode(language, code, test.input || "");
      const actual = normalizeOutput(execution.output);
      const expected = normalizeOutput(test.output);
      results.push({
        scope: label,
        input: test.input || "",
        expected,
        actual,
        error: execution.error || "",
        passed: execution.code === 0 && actual === expected
      });
    }
    return results;
  };

  const visibleResults = await runTests(visibleTests, "visible");
  const hiddenResults = await runTests(hiddenTests, "hidden");
  const allResults = [...visibleResults, ...hiddenResults];

  return {
    visibleResults,
    hiddenResults,
    allResults,
    visiblePassed: visibleResults.every((result) => result.passed),
    allPassed: allResults.every((result) => result.passed)
  };
};
