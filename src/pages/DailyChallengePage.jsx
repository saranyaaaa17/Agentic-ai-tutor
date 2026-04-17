
import { useMemo, useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { executeCode } from "../utils/codeExecution";
import { getDailyChallengeState, recordDailyChallengeSuccess, dailyChallenge } from "../utils/dailyChallenge";
import { useAuth } from "../context/AuthContext";

const languageLabels = {
  python: "Python 3",
  javascript: "JavaScript"
};

const normalizeOutput = (value = "") => value.replace(/\r\n/g, "\n").trim();

const DailyChallengePage = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const currentChallenge = dailyChallenge(); // Get dynamic challenge for today
  
  const [language, setLanguage] = useState("python");
  const [code, setCode] = useState(currentChallenge.starterCode.python);
  const [customInput, setCustomInput] = useState(currentChallenge.examples[0]?.input || "");
  const [consoleOutput, setConsoleOutput] = useState("");
  const [isRunning, setIsRunning] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [runResults, setRunResults] = useState([]);
  const [submitResults, setSubmitResults] = useState([]);
  const [submissionState, setSubmissionState] = useState(() => getDailyChallengeState(user?.id));

  // Sync state when user logs in/out
  useEffect(() => {
    setSubmissionState(getDailyChallengeState(user?.id));
  }, [user?.id]);

  const allVisibleTests = useMemo(() => {
      // Use sampleTests if available, otherwise examples
      return currentChallenge.sampleTests || currentChallenge.examples.map((ex, i) => ({
          name: `Example ${i + 1}`,
          input: ex.input,
          expectedOutput: ex.output
      }));
  }, [currentChallenge]);

  const handleLanguageChange = (nextLanguage) => {
    setLanguage(nextLanguage);
    setCode(currentChallenge.starterCode[nextLanguage]);
    setConsoleOutput("");
    setRunResults([]);
    setSubmitResults([]);
  };

  const runSingleExecution = async (stdin) => {
    const result = await executeCode(language, code, stdin);
    return {
      passed: result.code === 0,
      output: result.output || "",
      error: result.error || "",
      exitCode: result.code
    };
  };

  const handleRunCode = async () => {
    setIsRunning(true);
    setSubmitResults([]);
    setRunResults([]);
    setConsoleOutput("Compiling and running your code...");

    const result = await runSingleExecution(customInput);

    setIsRunning(false);
    setConsoleOutput(result.error || result.output || "Execution completed with no output.");
  };

  const evaluateTests = async (tests) => {
    const results = [];

    for (const test of tests) {
      const result = await executeCode(language, code, test.input);
      const actual = normalizeOutput(result.output);
      const expected = normalizeOutput(test.expectedOutput);

      results.push({
        name: test.name,
        passed: result.code === 0 && actual === expected,
        actual,
        expected,
        error: normalizeOutput(result.error),
        exitCode: result.code
      });

      if (result.code !== 0) {
        break;
      }
    }

    return results;
  };

  const handleRunTests = async () => {
    setIsRunning(true);
    setSubmitResults([]);
    setConsoleOutput("Running sample test cases...");

    const results = await evaluateTests(allVisibleTests);
    const passedCount = results.filter((result) => result.passed).length;

    setRunResults(results);
    setIsRunning(false);
    setConsoleOutput(`${passedCount}/${allVisibleTests.length} sample tests passed.`);
  };

  const handleSubmit = async () => {
    setIsSubmitting(true);
    setConsoleOutput("Submitting solution against hidden test cases...");

    const visibleResults = await evaluateTests(allVisibleTests);
    const visiblePassed = visibleResults.every((result) => result.passed);

    setRunResults(visibleResults);

    if (!visiblePassed) {
      setSubmitResults([]);
      setIsSubmitting(false);
      setConsoleOutput("Submission blocked. Pass all visible sample tests before submitting.");
      return;
    }

    const hiddenResults = await evaluateTests(currentChallenge.hiddenTests || currentChallenge.examples);
    const allPassed = hiddenResults.every((result) => result.passed);

    setSubmitResults(hiddenResults);
    setIsSubmitting(false);

    if (!allPassed) {
      setConsoleOutput("Submission failed on hidden tests. Review your code and try again.");
      return;
    }

    const nextState = recordDailyChallengeSuccess(user?.id);
    setSubmissionState(nextState);
    setConsoleOutput(
      nextState.incremented
        ? `All tests passed. Challenge solved. Streak increased to ${nextState.streak}.`
        : `All tests passed. Challenge already solved today. Streak remains ${nextState.streak}.`
    );
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100">
      <div className="max-w-7xl mx-auto px-6 py-8 space-y-6">
        <div className="flex items-center justify-between gap-4">
          <button
            onClick={() => navigate("/dashboard")}
            className="text-sm font-semibold text-slate-400 hover:text-white transition-colors"
          >
            Back to Dashboard
          </button>
          <div className="text-xs font-black uppercase tracking-[0.25em] text-slate-500">
            Daily Challenge Workspace
          </div>
        </div>

        <div className="grid grid-cols-1 xl:grid-cols-[420px_minmax(0,1fr)] gap-6">
          <section className="bg-slate-900/70 border border-white/10 rounded-3xl p-6 space-y-6 h-fit max-h-[90vh] overflow-y-auto custom-scrollbar">
            <div className="flex items-start justify-between gap-4">
              <div>
                <div className="text-[11px] font-black uppercase tracking-[0.25em] text-blue-400 mb-3">
                  Today&apos;s Challenge
                </div>
                <h1 className="text-3xl font-black text-white leading-tight">{currentChallenge.title}</h1>
              </div>
              <div className="text-right">
                <div className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-500">Streak</div>
                <div className="text-2xl font-black text-amber-400">{submissionState.streak}</div>
              </div>
            </div>

            <div className="flex items-center gap-3 text-xs font-black uppercase tracking-widest">
              <span className="px-3 py-1 rounded-full border border-rose-500/40 bg-rose-500/10 text-rose-400">
                {currentChallenge.difficulty}
              </span>
              <span className="text-slate-500">{currentChallenge.points} XP</span>
              <span className="text-slate-600">{currentChallenge.domain.toUpperCase()}</span>
            </div>

            <p className="text-sm leading-7 text-slate-300">{currentChallenge.description}</p>

            <div>
              <h2 className="text-xs font-black uppercase tracking-[0.2em] text-slate-500 mb-3">Input Format</h2>
              <ul className="space-y-2 text-sm text-slate-300">
                {currentChallenge.inputFormat.map((line) => (
                  <li key={line}>{line}</li>
                ))}
              </ul>
            </div>

            <div>
               <h2 className="text-xs font-black uppercase tracking-[0.2em] text-slate-500 mb-3">Output Format</h2>
               <p className="text-sm text-slate-300">{currentChallenge.outputFormat}</p>
            </div>

            {currentChallenge.constraints && (
                <div>
                   <h2 className="text-xs font-black uppercase tracking-[0.2em] text-slate-500 mb-3">Constraints</h2>
                   <ul className="space-y-2 text-sm text-slate-300">
                     {currentChallenge.constraints.map((line) => (
                       <li key={line}>{line}</li>
                     ))}
                   </ul>
                </div>
            )}

            <div>
              <h2 className="text-xs font-black uppercase tracking-[0.2em] text-slate-500 mb-3">Examples</h2>
              <div className="space-y-4">
                {currentChallenge.examples.map((example, index) => (
                  <div key={index} className="rounded-2xl bg-black/30 border border-white/5 p-4">
                    <div className="text-[11px] font-black uppercase tracking-[0.2em] text-slate-500 mb-2">
                       Example {index + 1}
                    </div>
                    <div className="space-y-2 text-xs font-mono">
                      <div>
                        <div className="text-slate-500 mb-1">Input</div>
                        <pre className="text-cyan-300 whitespace-pre-wrap">{example.input}</pre>
                      </div>
                      <div>
                        <div className="text-slate-500 mb-1">Output</div>
                        <pre className="text-emerald-300 whitespace-pre-wrap">{example.output}</pre>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </section>

          <section className="bg-slate-900/70 border border-white/10 rounded-3xl overflow-hidden flex flex-col h-[90vh]">
            <div className="flex flex-wrap items-center justify-between gap-3 px-5 py-4 border-b border-white/10 bg-slate-900 shrink-0">
              <div className="flex items-center gap-3">
                <span className="text-xs font-black uppercase tracking-[0.2em] text-slate-500">Compiler</span>
                <select
                  value={language}
                  onChange={(event) => handleLanguageChange(event.target.value)}
                  className="bg-slate-950 text-white text-sm px-3 py-2 rounded-xl border border-white/10 focus:outline-none focus:border-blue-500"
                >
                  {Object.entries(languageLabels).map(([value, label]) => (
                    <option key={value} value={value}>
                      {label}
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                <button
                  onClick={handleRunCode}
                  disabled={isRunning || isSubmitting}
                  className="px-4 py-2 rounded-xl text-xs font-black uppercase tracking-[0.2em] bg-slate-800 text-white hover:bg-slate-700 disabled:opacity-50"
                >
                  {isRunning ? "Running" : "Compile & Run"}
                </button>
                <button
                  onClick={handleRunTests}
                  disabled={isRunning || isSubmitting}
                  className="px-4 py-2 rounded-xl text-xs font-black uppercase tracking-[0.2em] bg-blue-600 text-white hover:bg-blue-500 disabled:opacity-50"
                >
                  Test Cases
                </button>
                <button
                  onClick={handleSubmit}
                  disabled={isRunning || isSubmitting}
                  className="px-4 py-2 rounded-xl text-xs font-black uppercase tracking-[0.2em] bg-emerald-500 text-black hover:bg-emerald-400 disabled:opacity-50"
                >
                  {isSubmitting ? "Submitting" : "Submit"}
                </button>
              </div>
            </div>

            <div className="grid grid-cols-1 2xl:grid-cols-[minmax(0,1fr)_360px] flex-1 overflow-hidden">
              <div className="flex flex-col border-r border-white/10 overflow-hidden">
                <textarea
                  value={code}
                  onChange={(event) => setCode(event.target.value)}
                  spellCheck="false"
                  className="flex-1 bg-[#111827] text-slate-100 font-mono text-sm p-5 resize-none focus:outline-none"
                />

                <div className="border-t border-white/10 bg-black/30 p-5 space-y-3 shrink-0">
                  <div className="flex items-center justify-between">
                    <div className="text-xs font-black uppercase tracking-[0.2em] text-slate-500">Custom Input</div>
                    <button
                      onClick={() => setCustomInput(currentChallenge.examples[0]?.input || "")}
                      className="text-[11px] font-bold text-blue-400 hover:text-blue-300"
                    >
                      Reset to sample
                    </button>
                  </div>
                  <textarea
                    value={customInput}
                    onChange={(event) => setCustomInput(event.target.value)}
                    spellCheck="false"
                    className="w-full h-28 bg-slate-950 text-slate-200 font-mono text-sm p-4 rounded-2xl border border-white/10 resize-none focus:outline-none focus:border-blue-500"
                  />
                </div>
              </div>

              <div className="flex flex-col overflow-hidden">
                <div className="h-1/3 border-b border-white/10 bg-black p-4 overflow-hidden flex flex-col">
                  <div className="text-xs font-black uppercase tracking-[0.2em] text-slate-500 mb-3">Console</div>
                  <pre className="flex-1 text-xs font-mono whitespace-pre-wrap text-emerald-300 overflow-auto">
                    {consoleOutput || "Compiler output will appear here."}
                  </pre>
                </div>

                <div className="h-1/3 border-b border-white/10 p-4 bg-slate-950/70 overflow-hidden flex flex-col">
                  <div className="text-xs font-black uppercase tracking-[0.2em] text-slate-500 mb-3">Visible Test Cases</div>
                  <div className="flex-1 overflow-auto space-y-3 custom-scrollbar">
                    {allVisibleTests.map((test) => {
                      const result = runResults.find((item) => item.name === test.name);

                      return (
                        <div key={test.name} className="rounded-2xl border border-white/5 bg-black/20 p-3">
                          <div className="flex items-center justify-between gap-3 mb-2">
                             <span className="text-sm font-bold text-white">{test.name}</span>
                             <span className={`text-[11px] font-black uppercase tracking-[0.2em] ${!result ? "text-slate-500" : result.passed ? "text-emerald-400" : "text-rose-400"}`}>
                               {!result ? "Pending" : result.passed ? "Passed" : "Failed"}
                             </span>
                          </div>
                          <div className="text-[11px] font-mono text-slate-400 whitespace-pre-wrap">{test.input}</div>
                          {result && !result.passed && (
                            <div className="mt-2 text-[11px] font-mono text-rose-300 whitespace-pre-wrap">
                              {result.error || `Expected: ${result.expected}\nGot: ${result.actual}`}
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>

                <div className="h-1/3 p-4 bg-slate-950/40 overflow-hidden flex flex-col">
                  <div className="text-xs font-black uppercase tracking-[0.2em] text-slate-500 mb-3">Submission Status</div>
                  <div className="flex-1 overflow-auto space-y-3 custom-scrollbar">
                    <div className="rounded-2xl border border-white/5 bg-black/20 p-4 space-y-3">
                        <div className="flex items-center justify-between">
                          <span className="text-sm font-bold text-white">Hidden Test Cases</span>
                          <span className={`text-[11px] font-black uppercase tracking-[0.2em] ${submitResults.length === 0 ? "text-slate-500" : submitResults.every((item) => item.passed) ? "text-emerald-400" : "text-rose-400"}`}>
                            {submitResults.length === 0 ? "Not submitted" : submitResults.every((item) => item.passed) ? "Passed" : "Failed"}
                          </span>
                        </div>
                        {submitResults.length === 0 ? (
                          <p className="text-[11px] text-slate-400 leading-relaxed">
                            Submit after passing all visible tests. Your streak grows by 1 on your first daily solve.
                          </p>
                        ) : (
                          <div className="space-y-2">
                            {submitResults.map((result) => (
                              <div key={result.name} className="flex items-center justify-between text-xs">
                                <span className="text-slate-300">{result.name}</span>
                                <span className={result.passed ? "text-emerald-400" : "text-rose-400"}>
                                  {result.passed ? "Passed" : "Failed"}
                                </span>
                              </div>
                            ))}
                          </div>
                        )}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
};

export default DailyChallengePage;
