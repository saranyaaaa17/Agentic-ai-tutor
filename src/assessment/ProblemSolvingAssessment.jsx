import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { supabase } from "../lib/supabase";
import { TeacherAgent } from "../agents/TeacherAgent";
// import { questionBank } from "../data/questionBank"; // optimization: unused import
import { generateAssessment, saveAssessmentState, loadAssessmentState, clearAssessmentState } from "../utils/assessmentUtils";
import CodePlayground from "../components/CodePlayground";
import MasteryRadar from "../components/MasteryRadar";
import FormattedQuestion from "../components/FormattedQuestion";
import AgentSystemPanel from "../components/agents/AgentSystemPanel";
import { syncMasteryToSupabase } from "../utils/syncUtils";
import { recordLearningActivity } from "../utils/learningActivity";
import { getRecommendedResources, groupResourcesByCategory, normalizeStrategyPayload } from "../utils/roadmapRecommendations";
import { ensureQuestionHints } from "../utils/questionEnhancers";
import { injectCodingChallenges } from "../data/problemSolvingChallenges";
import { evaluateCodingChallenge } from "../utils/codingAssessment";


const ProblemSolvingAssessment = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const domain = searchParams.get("domain") || "programming-problems";
  const subtopic = searchParams.get("subtopic");
  const assessmentId = `problem_${domain}_${subtopic || 'all'}_v3`; // Unique ID for persistence

  const [startTime, setStartTime] = useState(Date.now());
  const [questions, setQuestions] = useState([]);
  const [currentStep, setCurrentStep] = useState("intro"); // intro, assessment, evaluating, result
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [answers, setAnswers] = useState({});
  const [agentStatus, setAgentStatus] = useState("");
  const [score, setScore] = useState(0);
  const [level, setLevel] = useState("");
  const [analysis, setAnalysis] = useState(null);
  const [diagnosisResults, setDiagnosisResults] = useState([]);
  const [strategy, setStrategy] = useState(null); // New State for detailed diagnosis
  const [priorWeakConcepts, setPriorWeakConcepts] = useState([]); // ADAPTIVE: Store weakness for retakes
  const [thinkingSteps, setThinkingSteps] = useState([]);
  const [evaluationResults, setEvaluationResults] = useState({}); // Track AI evaluation correctness
  const [streak, setStreak] = useState(0);
  const [xpEarned, setXpEarned] = useState(0);
  const [interviewFeedback, setInterviewFeedback] = useState(null);
  const [badges, setBadges] = useState([]);
  const [timeLeft, setTimeLeft] = useState(0);
  const [timerActive, setTimerActive] = useState(false);
  const [isLocked, setIsLocked] = useState(false);
  const [showHint, setShowHint] = useState(false);
  const [codeSubmissions, setCodeSubmissions] = useState({});
  const [codeEvaluationState, setCodeEvaluationState] = useState({});

  const isLoaded = useRef(false);
  const topicLabel = subtopic ? `${subtopic} (${domain})` : domain;
  const strategyContext = {
    topic: topicLabel,
    weakConcepts: analysis?.weak_concepts || [],
    proficiencyLevel: level
  };
  const groupedStrategyResources = strategy
    ? (strategy.grouped_resources?.length
        ? strategy.grouped_resources
        : groupResourcesByCategory(strategy.recommended_courses || []))
    : [];
  const hasUsableStrategy = Boolean(strategy?.strategy_summary) && groupedStrategyResources.length > 0;
  const currentQuestion = questions[currentQuestionIndex];
  const currentCodingState = currentQuestion?.type === "coding"
    ? {
        code: codeSubmissions[currentQuestion.id]?.code ?? currentQuestion.starter_code ?? "",
        stdin: codeSubmissions[currentQuestion.id]?.stdin ?? currentQuestion.sample_input ?? "",
        language: codeSubmissions[currentQuestion.id]?.language ?? currentQuestion.language ?? "python"
      }
    : null;

  const prepareProblemQuestions = (questionList, topic = topicLabel) => {
    const hintedQuestions = ensureQuestionHints(questionList || [], topic);
    return injectCodingChallenges(hintedQuestions, domain);
  };

  const serializeAnswer = (answer) => {
    if (typeof answer === "string") return answer;
    if (answer && typeof answer === "object") return answer.summary || answer.code || "";
    return "";
  };

  // Map domain param to questionBank keys
  const getQuestionBankDomain = (dom) => {
      switch(dom) {
          case 'programming-problems': return 'programming';
          case 'dsa-problems': return 'dsa_hard';
          case 'sql-problems': return 'sql';
          case 'logic-problems': return 'logical';
          default: return 'programming';
      }
  };

  useEffect(() => {
    if (isLoaded.current) return;
    isLoaded.current = true;

    const savedState = loadAssessmentState(assessmentId);
    if (savedState) {
        setQuestions(ensureQuestionHints(savedState.questions || [], topicLabel));
        setAnswers(savedState.answers);
        setCurrentQuestionIndex(savedState.currentQuestionIndex);
        setCurrentStep(savedState.currentStep === 'intro' ? 'intro' : savedState.currentStep);
        if (savedState.score) setScore(savedState.score);
        if (savedState.level) setLevel(savedState.level);
        if (savedState.analysis) setAnalysis(savedState.analysis);
        if (savedState.strategy) {
            setStrategy(normalizeStrategyPayload(savedState.strategy, {
                topic: topicLabel,
                weakConcepts: savedState.analysis?.weak_concepts || [],
                proficiencyLevel: savedState.level || level
            }));
        }
    } else {
        const bankDomain = getQuestionBankDomain(domain);
        const newQuestions = prepareProblemQuestions(generateAssessment(bankDomain, 10), topicLabel);
        setQuestions(newQuestions);
    }

  }, [domain, assessmentId]);


  useEffect(() => {
    if (questions.length > 0 && currentStep !== 'intro') {
        saveAssessmentState(assessmentId, {
            questions,
            answers,
            currentQuestionIndex,
            currentStep,
            score,
            level,
            analysis,
            strategy // persist
        });
    }
  }, [questions, answers, currentQuestionIndex, currentStep, score, level, analysis, strategy, assessmentId]);

  // Fetch Strategy
  useEffect(() => {
    if (currentStep === 'learning-plan' && analysis && !hasUsableStrategy) {
        setAgentStatus("Strategy Agent: Curating personalized resources...");
        
        // Calculate basic metrics for the profile
        const timeTaken = Date.now() - (startTime || Date.now()); // Rough session time
        const learningSpeed = timeTaken < 300000 ? 'fast' : (timeTaken > 900000 ? 'slow' : 'medium'); // Example thresholds
        const confidenceScore = analysis.confidence_estimate || (score / 100); 
        const engagementScore = 0.9; // Placeholder for now, could track clicks/retries

        TeacherAgent.getStrategy(
            level, 
            analysis.weak_concepts || [], 
            topicLabel,
            analysis.mastery_profile || {}, 
            analysis.thinking_pattern || "balanced",
            learningSpeed,
            confidenceScore,
            engagementScore
        ).then(res => {
            setStrategy(normalizeStrategyPayload(res, strategyContext));
            setAgentStatus("");
        }).catch(err => {
            console.error("Strategy fetch failed", err);
            setStrategy(normalizeStrategyPayload({
              strategy_summary: `Focus on your weak problem-solving areas in ${subtopic || domain} through repeated pattern practice.`,
              daily_practice_tip: "Solve 2 focused questions on your weakest pattern, then review one model solution carefully.",
              recommended_courses: getRecommendedResources(topicLabel, analysis?.weak_concepts || []),
              session_goal: { primary_objective: analysis?.recommended_focus || 'Core Problem Solving', recommended_time_budget_minutes: 30 }
            }, strategyContext));
            setAgentStatus("");
        });
    }
  }, [currentStep, analysis, hasUsableStrategy, level, topicLabel, subtopic, domain, score, startTime]);



  // Use a ref for auto-save to avoid dependency loops

  const startAssessment = async () => {
    console.log('[ProblemSolving] 🚀 Starting assessment, calling Teacher Agent...');
    setAgentStatus("Problem Setter Agent: Generating custom challenges...");
    setThinkingSteps([]);
    
    let aiSuccess = false;

    try {
        const topic = subtopic ? `${subtopic} (${getDomainTitle()})` : (getDomainTitle() || domain);
        console.log(`[ProblemSolving] 📞 Calling TeacherAgent.generateAssessment("${topic}", "intermediate")`);
        
        // ADAPTIVE: Use priorWeakConcepts if available
        const concepts = priorWeakConcepts.length > 0 ? priorWeakConcepts : [];
        if (concepts.length > 0) console.log(`[ProblemSolving] 🎯 Targeting weak concepts: ${concepts.join(", ")}`);

        // Attempt to get AI-generated questions
        const data = await TeacherAgent.generateAssessment(topic, "intermediate", concepts, {}, 10);
        
        console.log('[ProblemSolving] 📦 Received response from Teacher Agent:', data);
        
        if (data.questions && Array.isArray(data.questions) && data.questions.length > 0) {
             console.log(`[ProblemSolving] ✅ Setting ${data.questions.length} AI-generated questions`);
             setQuestions(prepareProblemQuestions(data.questions, topic));
             if (data.thinking_steps) setThinkingSteps(data.thinking_steps);
             // Clear any old answers if questions changed
             setAnswers({});
             setCurrentQuestionIndex(0);
             aiSuccess = true;
        } else {
             console.warn("[ProblemSolving] ⚠️ AI returned no questions, using static fallback.");
        }
    } catch (err) {
        console.error("[ProblemSolving] ❌ Problem Setter Agent Error:", err);
        // Fallback is already loaded by useEffect, so just proceed
    } finally {
        setTimeout(() => {
            setCurrentStep("assessment");
            setAgentStatus(aiSuccess ? "✅ Challenges Generated by AI" : "⚠️ AI Unavailable - Using Standard Set");
            setTimeout(() => setAgentStatus(""), 2000);
        }, 1000);
    }
  };

  const [liveSignal, setLiveSignal] = useState(null);
  const [currentFeedback, setCurrentFeedback] = useState(null);

  useEffect(() => {
    if (currentStep === "assessment" && questions[currentQuestionIndex]) {
        const q = questions[currentQuestionIndex];
        const limit = q.time_limit || TeacherAgent.getTimeLimit(q.difficulty);
        setTimeLeft(limit);
        setTimerActive(true);
        setStartTime(Date.now());
        setLiveSignal(null);
        setCurrentFeedback(null);
    }
  }, [currentQuestionIndex, currentStep, questions]);

  useEffect(() => {
      let interval;
      if (timerActive && timeLeft > 0) {
          interval = setInterval(() => {
              setTimeLeft(prev => prev - 1);
          }, 1000);
      } else if (timeLeft === 0 && timerActive) {
          setTimerActive(false);
          setIsLocked(true);
          nextQuestion();
          // Auto-submit or move next if timed out
          handleAnswer("TIMEOUT");
      }
      return () => clearInterval(interval);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [timerActive, timeLeft]);

  const updateCodeSubmission = (updates) => {
    if (!currentQuestion?.type) return;

    setCodeSubmissions((prev) => ({
      ...prev,
      [currentQuestion.id]: {
        code: currentQuestion.starter_code ?? "",
        stdin: currentQuestion.sample_input ?? "",
        language: currentQuestion.language ?? "python",
        ...prev[currentQuestion.id],
        ...updates
      }
    }));
  };

  const handleCodingSubmission = async () => {
    if (!currentQuestion || currentQuestion.type !== "coding") return;

    setAgentStatus("Evaluator Agent: Running coding test suite...");
    const submission = currentCodingState;
    const topic = subtopic || getDomainTitle();

    try {
      const result = await evaluateCodingChallenge(currentQuestion, submission.code, submission.language);
      setCodeEvaluationState((prev) => ({ ...prev, [currentQuestion.id]: result }));

      const answerSummary = `Code submission using ${submission.language}. Visible tests passed: ${result.visibleResults.filter((test) => test.passed).length}/${result.visibleResults.length}. Hidden tests passed: ${result.hiddenResults.filter((test) => test.passed).length}/${result.hiddenResults.length}.`;

      setAnswers((prev) => ({
        ...prev,
        [currentQuestionIndex]: {
          type: "coding",
          code: submission.code,
          language: submission.language,
          summary: answerSummary
        }
      }));
      setEvaluationResults((prev) => ({ ...prev, [currentQuestionIndex]: result.allPassed }));

      const apiResponse = await TeacherAgent.evaluateAnswer(
        currentQuestion.q,
        answerSummary,
        topic,
        "Pass all visible and hidden tests",
        currentQuestion.concepts || []
      );

      const feedbackText = apiResponse?.feedback || (result.allPassed ? "All tests passed." : "Some tests are still failing.");

      setCurrentFeedback({
        correct: result.allPassed,
        concept: currentQuestion.concepts?.[0] || topic,
        mastery: {
          prev: 0.5,
          new: result.allPassed ? 0.6 : 0.45,
          delta: result.allPassed ? 0.1 : -0.05
        },
        nextDifficulty: result.allPassed ? "Hard" : "Medium",
        feedback: feedbackText,
        explanation: currentQuestion.explanation || "Use the failing tests to inspect edge cases and input handling."
      });
      setLiveSignal({
        type: result.allPassed ? "success" : "warning",
        message: result.allPassed
          ? "Compiler + hidden tests cleared. You can move to the next challenge."
          : "Some tests failed. Review the output panel and try again."
      });
    } catch (error) {
      console.error("[ProblemSolving] Coding evaluation failed:", error);
      setLiveSignal({
        type: "warning",
        message: "Compiler evaluation failed. Please retry the test run."
      });
    } finally {
      setAgentStatus("");
    }
  };

  const handleAnswer = async (answer) => {
    // 1. Calculate duration
    const duration = Date.now() - startTime;
    const isFast = duration < 5000; // < 5s
    const isSlow = duration > 20000; // > 20s
    
    // 2. Evaluate answer (Always call backend to update Learner Profile)
    const currentQ = questions[currentQuestionIndex];
    let isCorrect = false;
    
    if (currentQ) {
         try {
             const topic = subtopic || getDomainTitle();
             // Call Orchestrator via TeacherAgent
             const apiResponse = await TeacherAgent.evaluateAnswer(
                currentQ.q, 
                answer, 
                topic,
                currentQ.ans || "", // Pass correct answer if available (for MCQs)
                currentQ.concepts || []
             );
             
             console.log('[ProblemSolving] API Response:', apiResponse);
             
             // Handle unified response structure
             const evalData = apiResponse.evaluation || apiResponse; // Fallback if API returns direct object
             isCorrect = evalData.correct;
             
             // Check for immediate remediation
             if (apiResponse.strategy_recommendation) {
                 const strategy = apiResponse.strategy_recommendation;
                 setLiveSignal({ 
                    type: 'warning', 
                    message: `Gap Detected: ${strategy.session_goal?.primary_objective || 'Concept'}. Recommendation: ${strategy.next_action || 'Review'}`
                 });
             } else if (apiResponse.remediation_suggestion) {
                 // From Evaluator directly
                 setLiveSignal({
                     type: 'warning',
                     message: `Tip: ${apiResponse.remediation_suggestion.strategy}`
                 });
             }

             // Store the AI evaluation result (using raw logic for now)
             setEvaluationResults((prev) => ({ ...prev, [currentQuestionIndex]: isCorrect }));
             
             // VISIBLE ADAPTATION: Show mastery update
             // Mocking mastery visualization since full backend persistence is still evolving
             // In production this would come from `updated_student_profile`
             const concept = currentQ.concepts?.[0] || topic;
             const prevMastery = Math.random() * 0.5 + 0.3; // Placeholder
             const masteryDelta = isCorrect ? 0.09 : -0.05;
             const isPromotion = isCorrect && Math.random() > 0.7; // 30% chance of hard question next

             setCurrentFeedback({
                correct: isCorrect,
                concept: concept,
                mastery: {
                    prev: prevMastery,
                    new: Math.min(1, Math.max(0, prevMastery + masteryDelta)),
                    delta: masteryDelta
                },
                nextDifficulty: isPromotion ? "Hard" : "Medium",
                feedback: apiResponse.feedback || (isCorrect ? "Perfect logic!" : "Review this concept."),
                remediation: apiResponse.remediation_suggestion || null,
                strategy: apiResponse.strategy_recommendation || null,
                explanation: currentQ.explanation || "No deep explanation available."
             });

         } catch (error) {
             console.error('[ProblemSolving] Evaluation failed:', error);
             // Fallback: use local check if possible, else assume incorrect
             if (currentQ.ans) {
                 isCorrect = answer === currentQ.ans;
                 setCurrentFeedback({
                    correct: isCorrect,
                    concept: "Logic",
                    mastery: { prev: 0.5, new: isCorrect ? 0.55 : 0.45, delta: isCorrect ? 0.05 : -0.05 },
                    nextDifficulty: "Standard",
                    feedback: isCorrect ? "Correct answer!" : "Incorrect answer.",
                    explanation: currentQ.explanation
                 });
             }
         }
    }

    setAnswers((prev) => ({ ...prev, [currentQuestionIndex]: answer }));
  };

  const nextQuestion = () => {
    setIsLocked(false);
    setCurrentFeedback(null);
    if (currentQuestionIndex < questions.length - 1) {
      setAgentStatus("Problem Setter Agent: Loading next challenge...");
      setTimeout(() => {
        setCurrentQuestionIndex(prev => prev + 1);
    setShowHint(false);
        setAgentStatus("");
      }, 800);
    } else {
      submitAssessment();
    }
  };

  const submitAssessment = () => {
    setCurrentStep("evaluating");
    setAgentStatus("Evaluator Agent: Analyzing logic...");
    
    setTimeout(() => {
      calculateResult();
    }, 2000);
  };

  const calculateResult = async () => {
    let calculatedScore = 0;
    questions.forEach((q, index) => {
      // Check AI evaluation result first, then fallback to direct comparison
      if (evaluationResults[index] !== undefined) {
        if (evaluationResults[index]) calculatedScore++;
      } else if (answers[index] === q.ans) {
        calculatedScore++;
      }
    });


    const percentage = (calculatedScore / questions.length) * 100;
    let finalLevel = "Beginner";
    if (percentage > 70) finalLevel = "Advanced";
    else if (percentage >= 50) finalLevel = "Intermediate";

    setScore(percentage);
       // Call Knowledge Gap Agent
    setAgentStatus("Knowledge Gap Agent: Analyzing proficiency...");
    let analysisData = null;
    try {
        const topic = subtopic ? `${subtopic} (${getDomainTitle()})` : (getDomainTitle() || domain);
        
        // 1. Bulk Gap Analysis
        const serializedAnswers = Object.fromEntries(
          Object.entries(answers).map(([key, value]) => [key, serializeAnswer(value)])
        );
        const normalizedQuestions = questions.map((question) =>
          question.type === "coding"
            ? {
                ...question,
                options: question.options || ["Pass all tests", "Fail tests"],
                ans: "Pass all tests"
              }
            : question
        );

        const result = await TeacherAgent.analyzeGap(normalizedQuestions, serializedAnswers, topic);
        const analysisData = result.analysis;
        setAnalysis(analysisData);
        setStrategy(result.strategy);
        if (analysisData?.proficiency_level) setLevel(analysisData.proficiency_level); // Update level based on AI

        // 2. Specific Diagnosis for Mistakes (The new feature)
        // Find faulty answers
        const incorrectIndices = Object.keys(serializedAnswers)
            .filter(key => questions[key]?.type !== "coding")
            .filter(key => serializedAnswers[key] !== questions[key].ans)
            .map(key => parseInt(key));
        
        if (incorrectIndices.length > 0) {
             setAgentStatus("Diagnostic Specialist: deep diving into mistakes...");
             const diagnoses = [];
             
             // Analyze specific mistakes (limit to first 2 to keep UX fast)
             for (const idx of incorrectIndices.slice(0, 2)) {
                 const q = questions[idx];
                 const userAns = serializedAnswers[idx];

                 // Only analyze if there is a valid question object
                 if (q) {
                     // Call Evaluator first 
                     const evalResult = await TeacherAgent.evaluateAnswer(
                        q.q, 
                        userAns, 
                        topic,
                        q.ans,
                        q.concepts || [] 
                     );
                     
                     if (evalResult) {
                         // Call Diagnosis Agent with Evaluator Output
                         const diag = await TeacherAgent.diagnoseMistake(q.q, userAns, evalResult);
                         if (diag) {
                             diagnoses.push({
                                 question: q.q,
                                 userAnswer: userAns,
                                 correctAnswer: q.ans,
                                 ...diag
                             });
                         }
                     }
                 }
             }
             setDiagnosisResults(diagnoses);
        }

    } catch (e) {
        console.error("Gap Analysis failed", e);
    }
    setAgentStatus("");
    setCurrentStep("result");

    // Sync results
    if (user) {
       setAgentStatus("Updating your cognitive profile...");
       
       // Gamification & Interview Feedback Logic
       const earnedXP = Math.round(percentage * 10); // 10 XP per 1% in problem solving
       const currentStreak = 1; 
       
       setXpEarned(earnedXP);
       setStreak(currentStreak);

       recordLearningActivity({
          type: "problem_assessment_completed",
          title: `Completed ${domainTitle} challenge set`,
          points: earnedXP,
          score: Math.round(percentage),
       });
       
       const mockFeedback = {
          strength: percentage > 70 ? "Excellent algorithmic efficiency and clean variable naming." : "Good initial approach and problem identification.",
          weakness: percentage < 90 ? "Some edge cases were overlooked in the logic flow." : "Slight delay in optimizing the time complexity.",
          suggestion: "Focus on boundary value analysis for array problems."
       };
       setInterviewFeedback(mockFeedback);

       if (percentage === 100) {
          setBadges([{ name: "Bug Hunter", icon: "💎", desc: "100% Logic accuracy" }]);
       }

       syncMasteryToSupabase(user.id, analysisData || { mastery_profile: { [domain]: percentage / 100 } }).then(() => {
          setAgentStatus("");
       });
    }
  };

  const getDomainTitle = () => {
    switch(domain) {
        case "dsa-problems": return "Data Structures";
        case "sql-problems": return "SQL Challenges";
        case "logic-problems": return "Logical Reasoning";
        default: return "Programming";
    }
  };

  const getCoreSkills = () => {
    switch(domain) {
      case "dsa-problems": return ["Complexity", "Data Structures", "Recursion"];
      case "sql-problems": return ["Joins", "Aggregates", "Subqueries"];
      case "logic-problems": return ["Patterns", "Series", "Deduction"];
      default: return ["Algorithms", "Syntax", "Debugging"];
    }
  };

  const domainTitle = getDomainTitle();

  return (
    <div className="min-h-screen bg-slate-950 text-white flex flex-col items-center justify-center p-6 relative overflow-hidden font-sans tracking-wide selection:bg-green-500/30">
      
      {/* Background Grid with Fade */}
      <div className="absolute inset-0 bg-[url('/grid.svg')] bg-center [mask-image:linear-gradient(180deg,white,rgba(255,255,255,0))] pointer-events-none opacity-40" />
      
      {/* Agent Status Bar */}
      <AnimatePresence>
        {agentStatus && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="fixed top-8 left-1/2 transform -translate-x-1/2 bg-slate-900/80 backdrop-blur-xl border border-white/10 px-6 py-3 rounded-full shadow-2xl flex items-center gap-3 z-50 ring-1 ring-white/5"
          >
            <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse shadow-[0_0_12px_#4ADE80]" />
            <span className="text-xs font-bold text-green-100 tracking-wider uppercase font-mono">{agentStatus}</span>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="absolute top-8 left-8 z-50 flex gap-4">
         <button
            onClick={() => {
              clearAssessmentState(assessmentId);
              navigate('/');
            }}
            className="group flex items-center gap-2 px-5 py-2.5 bg-white/5 hover:bg-white/10 border border-white/5 hover:border-green-500/30 rounded-full backdrop-blur-md text-slate-400 hover:text-green-400 transition-all duration-300 shadow-lg hover:shadow-green-500/10"
         >
           <svg className="w-4 h-4 transform transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
           </svg>
           <span className="text-xs font-bold uppercase tracking-wider">Home</span>
         </button>
         <button
            onClick={() => {
              clearAssessmentState(assessmentId);
              navigate('/dashboard?mode=problem');
            }}
            className="group flex items-center gap-2 px-5 py-2.5 bg-white/5 hover:bg-white/10 border border-white/5 hover:border-green-500/30 rounded-full backdrop-blur-md text-slate-400 hover:text-green-400 transition-all duration-300 shadow-lg hover:shadow-green-500/10"
         >
           <svg className="w-4 h-4 transform group-hover:-translate-x-1 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor">
             <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
           </svg>
           <span className="text-xs font-bold uppercase tracking-wider">Exit</span>
         </button>
      </div>

      <div className="max-w-4xl w-full relative z-10">
        
        {currentStep === "intro" && (
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="w-full max-w-4xl mx-auto mt-12 mb-12"
          >
            <div className="text-center mb-16">
                 <div className="inline-flex items-center gap-2 mb-6 px-3 py-1 rounded-full border border-green-500/20 bg-green-500/10 text-green-400 text-xs font-bold uppercase tracking-wider">
                  <span className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse"></span>
                  Problem Solving Mode
                </div>

                <h1 className="text-5xl md:text-6xl font-black text-white mb-6 tracking-tight capitalize">
                  {subtopic ? subtopic.replace(/-problems|-/, ' ') : domainTitle}
                </h1>
                
                <p className="text-slate-400 text-lg max-w-2xl mx-auto leading-relaxed">
                  Sharpen your logic. Our AI agents will analyze your approach specifically to build a personalized mastery path.
                </p>
            </div>

            <div className="grid md:grid-cols-3 gap-8 mb-16">
                <div className="p-8 rounded-2xl border border-slate-800 bg-[#0A1120] hover:border-slate-700 transition-colors">
                    <div className="text-slate-500 font-bold mb-4 text-xs uppercase tracking-wider border-b border-slate-800 pb-2">Target Skills</div>
                    <div className="flex flex-wrap gap-2">
                      {getCoreSkills().map((skill, i) => (
                          <span key={i} className="px-2 py-1 bg-slate-800 text-slate-300 rounded text-xs font-medium border border-slate-700">{skill}</span>
                      ))}
                    </div>
                </div>
               
               <div className="p-8 rounded-2xl border border-slate-800 bg-[#0A1120] hover:border-slate-700 transition-colors flex flex-col justify-between">
                  <div className="text-slate-500 font-bold mb-2 text-xs uppercase tracking-wider border-b border-slate-800 pb-2">Format</div>
                  <div className="text-white text-xl font-medium">Interactive</div>
               </div>
               
               <div className="p-8 rounded-2xl border border-slate-800 bg-[#0A1120] hover:border-slate-700 transition-colors flex flex-col justify-between">
                  <div className="text-slate-500 font-bold mb-2 text-xs uppercase tracking-wider border-b border-slate-800 pb-2">Analysis</div>
                  <div className="text-white text-xl font-medium">Deep AI Insights</div>
               </div>
            </div>
            
            <div className="text-center">
                <button
                  onClick={startAssessment}
                  className="bg-white text-slate-900 hover:bg-slate-200 px-8 py-4 rounded-xl font-bold text-lg transition-all shadow-lg active:scale-95"
                >
                  Start Challenges
                </button>
            </div>

            <div className="mt-12">
              <AgentSystemPanel compact />
            </div>
          </motion.div>
        )}

        {currentStep === "assessment" && (
          <motion.div
            key="question-card"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="w-full max-w-3xl mx-auto bg-[#0A1120] border border-slate-800 p-6 md:p-8 rounded-2xl shadow-xl relative overflow-hidden"
          >
             {/* Progress Bar */}
             <div className="absolute top-0 left-0 h-1 bg-slate-800 w-full">
                <motion.div 
                    initial={{ width: 0 }}
                    animate={{ width: `${(currentQuestionIndex / questions.length) * 100}%` }}
                   className="h-full bg-green-500" />
              </div>

            <div className="flex justify-between items-center mb-6 px-5 py-3 bg-slate-900/50 rounded-xl border border-white/5 backdrop-blur-md">
                <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-green-500/10 border border-green-500/20 flex items-center justify-center text-lg">
                        💻
                    </div>
                    <div>
                        <div className="flex items-center gap-2">
                            <span className="text-white font-bold text-xs tracking-tight">{domainTitle}</span>
                        </div>
                        <div className="flex items-center gap-2 mt-0.5">
                            <div className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />
                            <span className="text-[9px] text-slate-500 font-bold uppercase tracking-widest leading-none">
                                Q {currentQuestionIndex + 1} / {questions.length}
                            </span>
                        </div>
                    </div>
                </div>
                <div className="flex items-center gap-6">
                    <div className="text-right">
                         <span className="block text-[8px] font-black text-slate-500 uppercase tracking-widest mb-1 leading-none">Time Limit</span>
                         <span className={`text-xl font-black tabular-nums tracking-tighter ${timeLeft < 10 ? 'text-rose-500 animate-pulse' : 'text-white'}`}>
                            {Math.floor(timeLeft / 60)}:{String(timeLeft % 60).padStart(2, '0')}
                         </span>
                    </div>
                    <div className="w-px h-6 bg-white/10" />
                    <div className="text-left min-w-[80px]">
                         <span className="block text-[8px] font-black text-slate-500 uppercase tracking-widest mb-1 leading-none">Progress</span>
                         <div className="flex flex-col gap-1.5 mt-0.5">
                            <span className="text-xs font-black text-white leading-none">{Math.round(((currentQuestionIndex + 1) / questions.length) * 100)}%</span>
                            <div className="w-full h-1 bg-slate-800 rounded-full overflow-hidden">
                                <motion.div 
                                    initial={{ width: 0 }}
                                    animate={{ width: `${(currentQuestionIndex / questions.length) * 100}%` }}
                                    className="h-full bg-blue-500 shadow-[0_0_10px_rgba(59,130,246,0.3)]"
                                />
                            </div>
                         </div>
                    </div>
                    <div className="w-px h-6 bg-white/10" />
                    <div className="text-right min-w-[80px]">
                        <span className="block text-[8px] font-black text-slate-500 uppercase tracking-widest mb-1 leading-none">Accuracy</span>
                        <div className="flex flex-col gap-1.5 mt-0.5">
                            {(() => {
                                const attempted = Object.keys(evaluationResults).length;
                                const correct = Object.values(evaluationResults).filter(Boolean).length;
                                const accuracy = attempted === 0 ? 0 : Math.round((correct / attempted) * 100);
                                
                                return (
                                    <>
                                        <span className={`text-xs font-black leading-none ${accuracy > 80 ? 'text-green-400' : 'text-slate-200'}`}>{accuracy}%</span>
                                        <div className="w-full h-1 bg-slate-800 rounded-full overflow-hidden">
                                            <motion.div 
                                                initial={{ width: 0 }}
                                                animate={{ width: `${accuracy}%` }}
                                                className={`h-full ${accuracy > 60 ? 'bg-green-500 shadow-[0_0_10px_rgba(34,197,94,0.3)]' : 'bg-amber-500'}`}
                                            />
                                        </div>
                                    </>
                                );
                            })()}
                        </div>
                    </div>
                </div>
            </div>

            <div className="mb-6 max-h-[140px] overflow-y-auto pr-2 custom-scrollbar border-b border-white/5 pb-4">
              <div className="text-slate-500 text-[9px] font-black uppercase tracking-widest mb-2">Challenge</div>
               <div className="text-base md:text-lg font-bold leading-tight text-white">
                 <FormattedQuestion text={questions[currentQuestionIndex]?.q} />
               </div>
               
               {/* Hint Trigger */}
               {questions[currentQuestionIndex]?.hint && (
                 <div className="mt-4 flex flex-col items-start gap-3">
                    <button 
                       onClick={() => setShowHint(!showHint)}
                       className="p-1 px-3 rounded-full bg-cyan-500/10 border border-cyan-500/20 text-cyan-400 text-[10px] font-black uppercase tracking-widest hover:bg-cyan-500/20 transition-all flex items-center gap-2"
                    >
                       💡
                       {showHint ? 'Hide Logic Hint' : 'Need a Logic Hint?'}
                    </button>
                    <AnimatePresence>
                       {showHint && (
                          <motion.div 
                             initial={{ opacity: 0, scale: 0.9 }}
                             animate={{ opacity: 1, scale: 1 }}
                             exit={{ opacity: 0, scale: 0.9 }}
                             className="text-cyan-200/60 text-xs italic font-medium max-w-lg bg-cyan-950/20 p-2 rounded-lg border border-cyan-500/10"
                          >
                             {questions[currentQuestionIndex]?.hint}
                          </motion.div>
                       )}
                    </AnimatePresence>
                 </div>
               )}
            </div>
 
            <div className="mb-8 relative">
              {/* Live Agent Signal */}
              <AnimatePresence>
                  {liveSignal && (
                      <motion.div 
                          initial={{ opacity: 0, y: -10, height: 0 }}
                          animate={{ opacity: 1, y: 0, height: 'auto' }}
                          exit={{ opacity: 0, y: -10, height: 0 }}
                          className="absolute -top-12 left-0 right-0 z-20"
                      >
                          <div className={`mx-auto max-w-sm px-4 py-2 rounded-lg shadow-xl flex items-center gap-3 border text-xs font-medium
                              ${liveSignal.type === 'warning' ? 'bg-amber-900/20 border-amber-500/20 text-amber-200' : 
                                liveSignal.type === 'success' ? 'bg-green-900/20 border-green-500/20 text-green-200' : 'bg-blue-900/20 border-blue-500/20 text-blue-200'}`}>
                              <span>{liveSignal.type === 'warning' ? '⚠' : liveSignal.type === 'success' ? '⚡' : '💡'}</span>
                              <span>{liveSignal.message}</span>
                          </div>
                      </motion.div>
                  )}
              </AnimatePresence>

              {currentQuestion?.type === "coding" ? (
                <div className="space-y-5">
                  <div className="rounded-2xl border border-white/8 bg-slate-950/40 p-4">
                    <p className="text-[10px] font-black uppercase tracking-[0.24em] text-slate-500">Coding Workspace</p>
                    <div className="mt-3 grid gap-4 lg:grid-cols-2">
                      <div className="rounded-2xl border border-white/8 bg-[#08101d] p-4">
                        <p className="text-[10px] font-black uppercase tracking-[0.24em] text-cyan-400">Prompt Details</p>
                        <p className="mt-3 whitespace-pre-line text-sm leading-7 text-slate-300">{currentQuestion.prompt}</p>
                      </div>
                      <div className="rounded-2xl border border-white/8 bg-[#08101d] p-4">
                        <p className="text-[10px] font-black uppercase tracking-[0.24em] text-cyan-400">Sample</p>
                        <div className="mt-3 grid gap-3">
                          <div>
                            <div className="text-[10px] font-black uppercase tracking-widest text-slate-500">Input</div>
                            <pre className="mt-2 whitespace-pre-wrap rounded-xl border border-white/5 bg-black/30 p-3 text-xs text-slate-200">{currentQuestion.sample_input}</pre>
                          </div>
                          <div>
                            <div className="text-[10px] font-black uppercase tracking-widest text-slate-500">Output</div>
                            <pre className="mt-2 whitespace-pre-wrap rounded-xl border border-white/5 bg-black/30 p-3 text-xs text-emerald-300">{currentQuestion.sample_output}</pre>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  <CodePlayground
                    language={currentCodingState?.language || "python"}
                    initialCode={currentQuestion.starter_code}
                    initialInput={currentQuestion.sample_input}
                    value={currentCodingState?.code || ""}
                    onChange={(nextCode) => updateCodeSubmission({ code: nextCode })}
                    stdinValue={currentCodingState?.stdin || ""}
                    onStdinChange={(nextInput) => updateCodeSubmission({ stdin: nextInput })}
                  />

                  {codeEvaluationState[currentQuestion.id] ? (
                    <div className="rounded-2xl border border-white/8 bg-slate-950/40 p-4">
                      <div className="flex items-center justify-between">
                        <p className="text-[10px] font-black uppercase tracking-[0.24em] text-slate-500">Compiler Test Results</p>
                        <span className={`rounded-full px-3 py-1 text-[10px] font-black uppercase tracking-widest ${codeEvaluationState[currentQuestion.id].allPassed ? "bg-emerald-500/10 text-emerald-300" : "bg-amber-500/10 text-amber-300"}`}>
                          {codeEvaluationState[currentQuestion.id].allPassed ? "Passed" : "Needs Work"}
                        </span>
                      </div>
                      <div className="mt-4 grid gap-3">
                        {codeEvaluationState[currentQuestion.id].allResults.map((test, index) => (
                          <div key={`${test.scope}-${index}`} className="rounded-2xl border border-white/8 bg-[#08101d] p-4">
                            <div className="flex items-center justify-between gap-3">
                              <div className="text-xs font-black uppercase tracking-widest text-slate-500">{test.scope} test {index + 1}</div>
                              <div className={`text-[10px] font-black uppercase tracking-widest ${test.passed ? "text-emerald-300" : "text-rose-300"}`}>
                                {test.passed ? "passed" : "failed"}
                              </div>
                            </div>
                            <div className="mt-3 grid gap-3 lg:grid-cols-3">
                              <pre className="rounded-xl border border-white/5 bg-black/30 p-3 text-[11px] text-slate-300 whitespace-pre-wrap">{test.input}</pre>
                              <pre className="rounded-xl border border-white/5 bg-black/30 p-3 text-[11px] text-emerald-300 whitespace-pre-wrap">{test.expected}</pre>
                              <pre className="rounded-xl border border-white/5 bg-black/30 p-3 text-[11px] text-sky-200 whitespace-pre-wrap">{test.error || test.actual}</pre>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  ) : null}
                </div>
              ) : (
                <div className="grid grid-cols-2 gap-3">
                  {questions[currentQuestionIndex]?.options.map((option, idx) => (
                    <button
                      key={idx}
                      onClick={() => handleAnswer(option)}
                      className={`w-full text-left p-3 rounded-lg border transition-all duration-200 flex items-center gap-3 group relative overflow-hidden h-full min-h-[60px]
                        ${answers[currentQuestionIndex] === option 
                          ? "bg-green-600/10 border-green-500 text-white shadow-[0_0_15px_rgba(34,197,94,0.1)]" 
                          : "bg-transparent border-slate-800 text-slate-400 hover:border-slate-600 hover:text-slate-200"}`}
                    >
                      <div className={`w-4 h-4 rounded-full border flex items-center justify-center shrink-0 transition-colors
                            ${answers[currentQuestionIndex] === option 
                                ? 'border-green-500' 
                                : 'border-slate-700 group-hover:border-slate-500'}`}>
                            {answers[currentQuestionIndex] === option && <div className="w-2 rounded-full bg-green-500 aspect-square"/>}
                      </div>
                      <span className="text-sm font-medium leading-snug tracking-tight relative z-10">{option}</span>
                    </button>
                  ))}
                </div>
              )}
            </div>



            <div className="flex justify-between items-center pt-8 border-t border-slate-800">
              <button
                onClick={() => setCurrentQuestionIndex(prev => Math.max(0, prev - 1))}
                disabled={currentQuestionIndex === 0}
                className={`text-slate-500 hover:text-white text-sm font-medium px-4 py-2 transition-colors
                  ${currentQuestionIndex === 0 ? "opacity-0 pointer-events-none" : ""}`}
              >
                Previous
              </button>

              <button
                onClick={currentQuestion?.type === "coding" && answers[currentQuestionIndex] === undefined ? handleCodingSubmission : nextQuestion}
                disabled={currentQuestion?.type === "coding" ? !currentCodingState?.code?.trim() : !answers[currentQuestionIndex]}
                className={`px-8 py-3 rounded-xl font-bold text-sm transition-all shadow-lg
                  ${(currentQuestion?.type === "coding" ? currentCodingState?.code?.trim() : answers[currentQuestionIndex]) 
                    ? "bg-white text-slate-900 hover:bg-slate-200" 
                    : "bg-slate-800 text-slate-500 cursor-not-allowed"}`}
              >
                {currentQuestion?.type === "coding" && answers[currentQuestionIndex] === undefined
                  ? "Check Solution"
                  : currentQuestionIndex === questions.length - 1
                    ? "Finish Assessment"
                    : "Next Challenge"}
              </button>
            </div>
          </motion.div>
        )}

        {currentStep === "evaluating" && (
          <div className="text-center py-24 px-8">
             <div className="relative w-20 h-20 mx-auto mb-6">
               <div className="absolute inset-0 border-2 border-slate-800 rounded-full" />
               <div className="absolute inset-0 border-2 border-green-500 rounded-full border-t-transparent animate-spin" />
             </div>
             <h3 className="text-2xl font-bold mb-2 text-white">Evaluating Logic</h3>
             <p className="text-slate-500 text-sm mb-8">Analyzing your thinking steps...</p>
             
             {thinkingSteps.length > 0 && (
                <div className="max-w-md mx-auto text-left space-y-2 opacity-50">
                  {thinkingSteps.map((step, i) => (
                    <motion.div 
                      key={i}
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: i * 0.2 }}
                      className="flex gap-3 text-xs font-mono"
                    >
                      <span className="text-green-500">[{i + 1}]</span>
                      <span className="text-slate-400">{step}</span>
                    </motion.div>
                  ))}
                </div>
             )}
          </div>
        )}

        {currentStep === "result" && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="w-full max-w-4xl mx-auto bg-[#0A1120] border border-slate-800 p-12 rounded-2xl shadow-xl text-center"
          >
             <div className="mb-12">
               <span className="inline-block px-3 py-1 rounded-full bg-slate-800 text-slate-400 text-xs font-bold uppercase tracking-wider mb-4">
                  Assessment Complete
               </span>
               <h2 className="text-4xl font-bold text-white mb-2">Cognitive Profile Generated</h2>
            </div>
            
            <div className="grid md:grid-cols-3 gap-6 mb-8 text-left">
                <div className="bg-slate-900/50 p-6 rounded-2xl border border-white/5">
                    <span className="text-slate-500 text-[10px] font-bold uppercase tracking-[0.2em] block mb-2">XP EARNED</span>
                    <div className="flex items-baseline gap-2">
                         <span className="text-4xl font-black text-blue-400">+{xpEarned}</span>
                         <span className="text-xs text-slate-500 uppercase font-bold tracking-widest">Points</span>
                    </div>
                </div>

                <div className="bg-slate-900/50 p-6 rounded-2xl border border-white/5">
                    <span className="text-slate-500 text-[10px] font-bold uppercase tracking-[0.2em] block mb-2">Accuracy Rate</span>
                    <div className="flex items-end gap-2">
                        <span className="text-4xl font-black text-green-400">{Math.round(score)}%</span>
                    </div>
                    <div className="h-1 w-full bg-slate-800 rounded-full mt-3 overflow-hidden">
                        <div className="h-full bg-green-500" style={{ width: `${score}%` }} />
                    </div>
                </div>

                <div className="bg-slate-900/50 p-6 rounded-2xl border border-white/5">
                    <span className="text-slate-500 text-[10px] font-bold uppercase tracking-[0.2em] block mb-2">current streak</span>
                    <div className="flex items-baseline gap-2">
                        <span className="text-4xl font-black text-amber-500">{streak}</span>
                        <span className="text-xs text-slate-500 uppercase font-bold tracking-widest">Days</span>
                    </div>
                </div>
            </div>

            {/* Interview Feedback Section (The Gold Feature) */}
            {interviewFeedback && (
              <motion.div 
                initial={{ opacity: 0, scale: 0.98 }}
                animate={{ opacity: 1, scale: 1 }}
                className="bg-slate-900/40 border border-slate-800 rounded-3xl p-8 mb-12 text-left relative overflow-hidden"
              >
                  <div className="absolute top-0 right-0 p-8 opacity-5">
                     <span className="text-8xl">🧑💼</span>
                  </div>
                  
                  <h3 className="text-sm font-black text-white uppercase tracking-widest mb-8 flex items-center gap-3">
                     <div className="w-8 h-8 rounded-lg bg-blue-500/10 flex items-center justify-center border border-blue-500/20">
                        <span className="text-xs">📋</span>
                     </div>
                     Interview Feedback
                  </h3>

                  <div className="space-y-6">
                     <div className="flex gap-4">
                        <div className="text-green-500 font-bold shrink-0 text-xl">✔</div>
                        <div>
                           <div className="text-[10px] font-black text-green-500/80 uppercase tracking-widest mb-1">Strength</div>
                           <p className="text-sm text-slate-300 font-medium leading-relaxed">{interviewFeedback.strength}</p>
                        </div>
                     </div>

                     <div className="flex gap-4">
                        <div className="text-rose-500 font-bold shrink-0 text-xl">❌</div>
                        <div>
                           <div className="text-[10px] font-black text-rose-500/80 uppercase tracking-widest mb-1">Weakness</div>
                           <p className="text-sm text-slate-300 font-medium leading-relaxed">{interviewFeedback.weakness}</p>
                        </div>
                     </div>

                     <div className="flex gap-4">
                        <div className="text-blue-500 font-bold shrink-0 text-xl">💡</div>
                        <div>
                           <div className="text-[10px] font-black text-blue-500/80 uppercase tracking-widest mb-1">Suggestion</div>
                           <p className="text-sm text-slate-300 font-medium leading-relaxed">{interviewFeedback.suggestion}</p>
                        </div>
                     </div>
                  </div>
              </motion.div>
            )}

            {/* Badges Section */}
            {badges.length > 0 && (
              <div className="mb-12 flex justify-center">
                {badges.map((b, i) => (
                  <motion.div 
                    key={i} 
                    initial={{ scale: 0.8, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    className="flex flex-col items-center bg-linear-to-b from-blue-500/10 to-transparent border border-blue-500/20 rounded-2xl p-4 min-w-[140px]"
                  >
                    <div className="text-4xl mb-2">{b.icon}</div>
                    <div className="text-xs font-black text-white uppercase tracking-wider">{b.name}</div>
                    <div className="text-[9px] text-slate-500 font-bold uppercase mt-1">{b.desc}</div>
                  </motion.div>
                ))}
              </div>
            )}

            {/* Predictive Insights Section (New) */}
            {analysis?.risk_level && (
                 <div className="grid md:grid-cols-2 gap-6 mb-12 text-left">
                     <div className="bg-slate-900/30 p-6 rounded-xl border border-slate-800">
                         <div className="flex items-center justify-between mb-4">
                            <h4 className="text-xs font-bold text-slate-500 uppercase tracking-widest">Future Risk Projection</h4>
                            <div className={`w-2 h-2 rounded-full ${
                                 analysis.risk_level === 'high' ? 'bg-red-500 animate-pulse' :
                                 analysis.risk_level === 'medium' ? 'bg-yellow-500' : 'bg-green-500'
                             }`} />
                         </div>
                         
                         <span className={`block text-xl font-bold mb-2 capitalize ${
                             analysis.risk_level === 'high' ? 'text-red-400' :
                             analysis.risk_level === 'medium' ? 'text-yellow-400' : 'text-green-400'
                         }`}>
                             {analysis.risk_level} Risk
                         </span>
                         
                         <p className="text-slate-400 text-sm leading-relaxed">
                             {analysis.risk_level === 'high' ? "Critical gaps in foundational concepts detected. Proceeding to advanced topics without remediation is likely to cause failure." : 
                              analysis.risk_level === 'medium' ? "Some shaky foundations detected. Consider reinforcing basics before tackling complex problems." :
                              "Solid foundation verified. You are statistically likely to succeed in advanced topics."}
                         </p>
                     </div>

                     <div className="bg-slate-900/30 p-6 rounded-xl border border-slate-800">
                         <h4 className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-4">Priority Focus Areas</h4>
                         {analysis.priority_concepts?.length > 0 ? (
                             <div className="flex flex-wrap gap-2 mb-3">
                                 {analysis.priority_concepts.map((c, i) => (
                                     <span key={i} className="px-3 py-1 bg-red-500/10 text-red-300 border border-red-500/20 rounded-lg text-xs font-bold">
                                         {c}
                                     </span>
                                 ))}
                             </div>
                         ) : (
                             <div className="text-green-400 text-sm font-bold mb-3">No critical blocks found.</div>
                         )}
                         <p className="text-slate-500 text-xs">These concepts are identified as high-leverage blockers for your growth.</p>
                     </div>
                 </div>
            )}

            <div className="flex flex-wrap gap-4 justify-center mb-12">
              <button
                onClick={() => {
                  clearAssessmentState(assessmentId);
                  navigate("/dashboard?mode=problem");
                }}
                className="px-6 py-3 rounded-xl font-bold text-sm text-slate-400 hover:text-white hover:bg-white/5 border border-transparent hover:border-white/10 transition-colors"
              >
                Back to Dashboard
              </button>
              
              {analysis && (
                  <button
                    onClick={() => setCurrentStep("analysis")} 
                    className="bg-purple-600 hover:bg-purple-500 text-white px-8 py-3 rounded-xl font-bold text-sm transition-all shadow-lg hover:shadow-purple-500/20"
                  >
                    View Knowledge Gap
                  </button>
              )}
              <button
                onClick={() => setCurrentStep("learning-plan")} 
                className="bg-white text-slate-900 px-8 py-3 rounded-xl font-bold text-sm transition-all shadow-lg hover:bg-slate-200 group"
              >
                See Recommendations
              </button>
            </div>
            
            <div className="flex justify-center">
                 <button
                       onClick={() => {
                         clearAssessmentState(assessmentId);
                         
                         // ADAPTIVE: Capture current weaknesses for the next round
                         if (analysis && analysis.weak_concepts) {
                             setPriorWeakConcepts(analysis.weak_concepts);
                         }

                         const bankDomain = getQuestionBankDomain(domain);
                         const newQuestions = generateAssessment(bankDomain, 10);
                         setQuestions(newQuestions);
                         setAnswers({});
                         setCurrentQuestionIndex(0);
                         setScore(0);
                         setLevel("");
                         setAnalysis(null);
                         setDiagnosisResults([]);
                         setStrategy(null);
                         setCurrentStep("intro");
                         isLoaded.current = false;
                      }}
                       className="group text-xs font-bold uppercase tracking-widest text-slate-500 hover:text-green-400 transition-colors flex items-center gap-2 py-2"
                    >
                        <svg className="w-4 h-4 group-hover:rotate-180 transition-transform duration-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" /></svg>
                        Retake Assessment
                    </button>
            </div>

             <p className="text-[10px] text-slate-600 max-w-lg mx-auto leading-relaxed mt-8">
              *Disclaimer: This assessment is an AI-generated evaluation for educational purposes. 
              Results are indicative of your current problem-solving skills and eligible difficulty level.
            </p>
          </motion.div>
        )}

        {currentStep === "analysis" && analysis && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="w-full max-w-4xl mx-auto mt-8 bg-[#0A1120] rounded-2xl border border-slate-800 p-8 shadow-xl"
          >
             {/* Header */}
             <div className="flex items-center justify-between mb-8 pb-6 border-b border-slate-800">
                <div>
                    <h2 className="text-2xl font-bold text-white mb-1">Knowledge Analysis</h2>
                    <p className="text-slate-400 text-sm">Detailed breakdown of your cognitive patterns.</p>
                </div>
                <div className="text-right">
                    <span className={`block px-3 py-1 rounded-md text-xs font-bold border uppercase tracking-wide mb-1
                        ${analysis.proficiency_level === 'Advanced' ? 'bg-purple-500/10 text-purple-300 border-purple-500/20' : 
                          analysis.proficiency_level === 'Intermediate' ? 'bg-blue-500/10 text-blue-300 border-blue-500/20' : 
                          'bg-green-500/10 text-green-300 border-green-500/20'
                        }`}>
                        {analysis.proficiency_level}
                    </span>
                    <span className="text-[10px] text-slate-500 font-mono uppercase">Proficiency Level</span>
                </div>
             </div>

             <div className="grid md:grid-cols-3 gap-8 mb-8">
                {/* Visual Overview Column */}
                <div className="md:col-span-1 space-y-6">
                    <div>
                        <h3 className="text-slate-500 text-xs font-bold uppercase tracking-wider mb-3">
                            Strengths
                        </h3>
                        <div className="flex flex-wrap gap-2">
                            {analysis.strong_concepts?.length > 0 ? (
                                analysis.strong_concepts.map((c, i) => (
                                    <span key={i} className="px-2.5 py-1 bg-green-900/10 text-green-400 rounded-md text-xs font-medium border border-green-500/10 flex items-center gap-1.5">
                                        <span className="w-1 h-1 rounded-full bg-green-500"></span>
                                        {c}
                                    </span>
                                ))
                            ) : (
                                <span className="text-slate-600 text-xs italic">No specific strengths identified yet.</span>
                            )}
                        </div>
                    </div>

                    <div>
                         <h3 className="text-slate-500 text-xs font-bold uppercase tracking-wider mb-3">
                            Focus Areas
                        </h3>
                        <div className="flex flex-wrap gap-2">
                            {analysis.weak_concepts?.length > 0 ? (
                                analysis.weak_concepts.map((c, i) => (
                                    <span key={i} className="px-2.5 py-1 bg-red-900/10 text-red-400 rounded-md text-xs font-medium border border-red-500/10 flex items-center gap-1.5">
                                        <span className="w-1 h-1 rounded-full bg-red-500"></span>
                                        {c}
                                    </span>
                                ))
                            ) : (
                                <span className="text-slate-600 text-xs italic">All concepts look solid!</span>
                            )}
                        </div>
                    </div>
                </div>

                {/* Detailed Analysis Column */}
                <div className="md:col-span-2">
                    <div className="bg-slate-900/50 border border-slate-800 p-6 rounded-xl h-full">
                        <div className="flex items-center gap-2 mb-3">
                             <span className="text-blue-400 bg-blue-500/10 p-1.5 rounded-lg">
                                 <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                     <path d="M9.663 17h4.674M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 1 1 7.072 0l-.543 2.224a1 1 0 0 1-.97.757H10.44a1 1 0 0 1-.97-.757L8.47 15.543z"></path>
                                 </svg>
                             </span>
                            <h3 className="text-slate-300 font-bold text-xs uppercase tracking-wider">Analysis Insight</h3>
                        </div>
                        <div className="prose prose-invert prose-sm max-w-none text-slate-300 font-light leading-relaxed mb-6 border-l-2 border-slate-700 pl-4">
                             <p className="text-white font-medium mb-1">"{analysis.gap_analysis.split('.')[0]}."</p>
                             <p className="text-xs text-slate-400">{analysis.gap_analysis.split('.').slice(1).join('.')}</p>
                        </div>
                        
                        <div className="bg-purple-950/20 border border-purple-500/10 p-4 rounded-lg flex items-center gap-4">
                             <div className="flex-1">
                                <span className="block text-[10px] font-bold text-purple-400/80 uppercase tracking-widest mb-1">Recommended Priority</span>
                                <span className="text-white font-medium text-sm">"{analysis.recommended_focus}"</span>
                            </div>
                        </div>
                    </div>
                </div>
             </div>

             {/* Deep Dive Diagnosis Section (Simplified) */}
             {diagnosisResults && diagnosisResults.length > 0 && (
                <div className="mb-8 border-t border-slate-800 pt-8">
                    <h3 className="text-slate-300 font-bold text-sm uppercase tracking-wider mb-4">Mistake Deep Dive</h3>
                    <div className="space-y-4">
                        {diagnosisResults.map((diag, i) => (
                            <div key={i} className="bg-slate-900/30 p-4 border border-slate-800 rounded-xl hover:border-slate-700 transition-colors">
                                <div className="flex justify-between items-start mb-2">
                                    <div className="flex items-center gap-2">
                                        <span className="text-red-400 font-mono text-xs px-1.5 py-0.5 bg-red-500/10 rounded-md">Mistake {i+1}</span>
                                        <span className="text-slate-500 text-[10px] font-mono border border-slate-800 px-1 rounded">Ans: {diag.userAnswer}</span>
                                    </div>
                                    <span className="text-green-500 text-[10px] font-mono border border-green-900/30 px-1 rounded bg-green-900/10">Correct: {diag.correctAnswer}</span>
                                </div>
                                <p className="text-slate-200 text-sm font-medium mb-3">"{diag.question}"</p>
                                
                                <div className="grid md:grid-cols-2 gap-4 text-xs bg-black/20 p-3 rounded-lg border border-white/5">
                                    <div>
                                        <span className="text-slate-500 font-bold block mb-1">Root Cause</span>
                                        <span className="text-slate-400 leading-relaxed">{diag.root_cause}</span>
                                    </div>
                                    {diag.misconception_trap && (
                                         <div>
                                            <span className="text-rose-400 font-bold block mb-1">Misconception Trap</span>
                                            <span className="text-rose-300/80 italic leading-relaxed">"{diag.misconception_trap}"</span>
                                         </div>
                                    )}
                                </div>
                                {diag.reasoning && (
                                     <div className="mt-2 text-[10px] text-blue-300/60 pl-2 border-l border-blue-500/20">
                                        Review Tip: {diag.reasoning}
                                     </div>
                                )}
                                <div className="mt-2 flex justify-end">
                                     <span className="text-[10px] text-purple-400 font-mono">Missed: {diag.missing_concept}</span>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}

             <div className="flex justify-end gap-3 pt-4 border-t border-white/5">
                  <button
                    onClick={() => setCurrentStep("result")} 
                    className="text-slate-400 hover:text-white text-sm font-medium px-4 py-2 hover:bg-white/5 rounded-lg transition-colors"
                  >
                    Back to Score
                  </button>
                  <button
                    onClick={() => setCurrentStep("learning-plan")} 
                    className="bg-white text-slate-900 hover:bg-slate-200 px-5 py-2 rounded-lg font-bold text-sm transition-colors shadow-lg"
                  >
                    View Recommended Strategy →
                  </button>
             </div>
          </motion.div>
        )}

        {currentStep === "learning-plan" && (
            <motion.div
             initial={{ opacity: 0, scale: 0.95 }}
             animate={{ opacity: 1, scale: 1 }}
             className="bg-[#0A1120] border border-slate-800 p-8 md:p-12 rounded-2xl shadow-xl text-center max-w-5xl mx-auto overflow-hidden relative"
            >
             {(() => {
                if (!strategy) {
                     return (
                        <div className="flex flex-col items-center justify-center p-20 space-y-6">
                            <div className="relative">
                                <div className="w-12 h-12 border-2 border-slate-800 border-t-green-500 rounded-full animate-spin"></div>
                            </div>
                            <p className="text-slate-500 font-mono text-xs animate-pulse tracking-widest uppercase">Strategy Agent Architecting Path...</p>
                        </div>
                    );
                }

                return (
                 <div className="flex flex-col gap-10 text-left w-full">
                   {/* Strategy Overview */}
                   <div className="bg-slate-900/50 p-8 rounded-2xl border border-slate-800 grid md:grid-cols-3 gap-8 items-start">
                        
                        {/* LEFT: Radar & Pattern */}
                        <div className="md:col-span-1 flex flex-col gap-6">
                            <MasteryRadar masteryProfile={analysis?.mastery_profile} />
                            
                            {analysis?.thinking_pattern && (
                                <div className="bg-slate-800/50 p-4 rounded-xl border border-slate-800 text-center">
                                    <span className="text-[10px] font-bold uppercase tracking-widest text-slate-500 block mb-2">Detected Pattern</span>
                                    <span className={`text-sm font-bold ${
                                        analysis.thinking_pattern.includes('Misconception') ? 'text-red-400' : 
                                        analysis.thinking_pattern.includes('Fragile') ? 'text-yellow-400' : 'text-blue-400'
                                    }`}>
                                        {analysis.thinking_pattern}
                                    </span>
                                </div>
                            )}

                            {/* Teaching Style (New) */}
                            {strategy.teaching_style && (
                                <div className="bg-slate-800/50 p-4 rounded-xl border border-slate-800 text-center">
                                    <span className="text-[10px] font-bold uppercase tracking-widest text-slate-500 block mb-2">Recommended Approach</span>
                                    <span className="text-sm font-bold text-white block mb-1">
                                        {strategy.teaching_style}
                                    </span>
                                    <span className="text-xs text-slate-500">
                                        Pace: <span className="text-green-400">{strategy.pace}</span>
                                    </span>
                                </div>
                            )}
                        </div>

                        {/* RIGHT: Strategy Content */}
                        <div className="md:col-span-2">
                        
                        {/* Session Goal Header */}
                        {strategy.session_goal && (
                            <div className="mb-8 pb-8 border-b border-slate-800">
                                <div className="flex items-center gap-3 mb-2">
                                     <span className="text-xs font-bold uppercase tracking-widest text-purple-400">Next Session Plan</span>
                                     <span className="text-xs font-medium text-slate-500 bg-slate-800 px-2 py-0.5 rounded border border-slate-700">
                                        {strategy.session_goal.recommended_time_budget_minutes} min • {strategy.session_goal.estimated_cognitive_load} Load
                                     </span>
                                </div>
                                <h2 className="text-2xl font-bold text-white leading-tight">
                                    {strategy.session_goal.primary_objective}
                                </h2>
                                <p className="text-slate-400 mt-2 text-sm font-medium">
                                    <span className="text-slate-500">Reinforcing:</span> {strategy.session_goal.secondary_reinforcement}
                                </p>
                            </div>
                        )}

                        <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-3">
                             <span className="flex items-center justify-center w-6 h-6 rounded bg-green-900/20 text-green-400 border border-green-500/20">
                                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>
                             </span>
                             Strategic Context
                        </h3>
                        <p className="text-slate-300 text-base italic leading-relaxed font-light">"{strategy.strategy_summary}"</p>
                        
                        <div className="mt-6 flex flex-col sm:flex-row gap-3 items-start sm:items-center bg-slate-800/30 p-4 rounded-xl border border-slate-800">
                            <span className="text-xs font-bold uppercase tracking-wider text-slate-500 shrink-0">Daily Tip</span>
                            <span className="text-green-400 font-medium text-sm">{strategy.daily_practice_tip}</span>
                        </div>

                        {strategy.reasoning && (
                            <div className="mt-6 border-t border-slate-800 pt-4">
                                 <div className="flex items-center gap-2 mb-2">
                                    <span className="w-1.5 h-1.5 bg-blue-500 rounded-full"></span>
                                    <span className="text-xs font-bold uppercase tracking-widest text-slate-500">Why this path?</span>
                                 </div>
                                 <p className="text-slate-400 text-sm leading-relaxed pl-4 border-l border-slate-700 py-1 italic">
                                     "{strategy.reasoning}"
                                 </p>
                            </div>
                        )}
                        </div>
                   </div>

                   <div className="flex items-center gap-4 py-2 border-b border-slate-800">
                       <h3 className="text-2xl font-bold text-white tracking-tight">Recommended Resources</h3>
                       <span className="bg-slate-800 border border-slate-700 text-xs font-bold px-3 py-1 rounded-full text-slate-400">
                           {strategy.recommended_courses?.length || 0} Curated
                       </span>
                   </div>

                   {strategy.roadmap?.length > 0 && (
                      <div className="grid gap-4 md:grid-cols-3">
                         {strategy.roadmap.map((step, index) => (
                            <div key={`${step.phase}_${index}`} className="rounded-2xl border border-slate-800 bg-slate-900/50 p-5">
                               <div className="text-[10px] font-black uppercase tracking-[0.24em] text-blue-400">{step.phase}</div>
                               <h4 className="mt-2 text-sm font-bold text-white">{step.title}</h4>
                               <p className="mt-2 text-xs leading-6 text-slate-400">{step.focus}</p>
                               <p className="mt-3 text-xs font-medium text-slate-300">Do: {step.action}</p>
                               <p className="mt-2 text-xs text-slate-500">Outcome: {step.outcome}</p>
                            </div>
                         ))}
                      </div>
                   )}

                   <div className="space-y-8">
                   {groupedStrategyResources.map((group) => (
                     <div key={group.category}>
                       <div className="flex items-center justify-between mb-4">
                         <h4 className="text-sm font-bold text-white">{group.category}</h4>
                         <span className="text-[11px] text-slate-500">{group.items.length} resource{group.items.length > 1 ? "s" : ""}</span>
                       </div>
                       <div className="flex flex-col gap-6">
                   {group.items.map((resource, index) => (
                      <div key={`${group.category}_${index}`} className="grid md:grid-cols-2 gap-8 items-stretch bg-[#0A1120] p-6 rounded-2xl border border-slate-800 hover:border-slate-700 transition-colors">
                          {/* Resource Card */}
                          <div className="bg-slate-900 rounded-xl p-6 flex flex-col justify-between h-full border border-slate-800 relative overflow-hidden">
                                <div className="absolute top-0 right-0 bg-slate-800 text-slate-300 text-[10px] font-bold px-3 py-1 rounded-bl-xl uppercase tracking-widest border-l border-b border-slate-700">
                                    {group.category}
                                </div>
                               
                               <div>
                                   <div className="flex justify-between items-center mb-4">
                                        <span className="inline-block px-2 py-1 bg-slate-800 text-slate-400 text-[10px] font-bold uppercase tracking-wider rounded border border-slate-700">
                                            {resource.platform}
                                        </span>
                                         <div className="flex text-yellow-500/80 text-[10px] gap-0.5">
                                            {[1,2,3,4,5].map(s => (
                                                <svg key={s} className="w-3 h-3 fill-current" viewBox="0 0 24 24">
                                                    <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"></path>
                                                </svg>
                                            ))}
                                        </div>
                                   </div>

                                   <h3 className="text-white text-xl font-bold mb-3 leading-tight">
                                       {resource.title}
                                   </h3>

                                   <p className="text-slate-500 mb-6 text-sm leading-relaxed line-clamp-3 font-medium">
                                     {resource.description}
                                   </p>

                                   {resource.covered_concepts && (
                                      <div className="mb-4">
                                          <div className="flex flex-wrap gap-2">
                                              {resource.covered_concepts.map((c, i) => (
                                                  <span key={i} className="px-2 py-1 bg-slate-800 text-slate-400 text-[10px] font-bold rounded border border-slate-700">
                                                      {c}
                                                  </span>
                                              ))}
                                          </div>
                                      </div>
                                   )}
                               </div>

                               <a 
                                 href={resource.url || "#"} 
                                 target="_blank" 
                                 rel="noopener noreferrer"
                                 className="mt-4 w-full flex items-center justify-center gap-3 text-slate-900 font-bold py-3 rounded-xl transition-all bg-white hover:bg-slate-200 active:scale-95 text-sm"
                               >
                                 Start Learning
                                 <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" /></svg>
                               </a>
                          </div>

                          {/* Video Preview */}
                          <div className="flex flex-col h-full gap-4">
                             <div className="bg-slate-900 rounded-xl p-1 border border-slate-800 shadow-sm flex-1 flex flex-col min-h-[200px] relative">
                                <div className="relative w-full h-full rounded-lg overflow-hidden bg-black flex-1">
                                    <iframe 
                                      className="absolute top-0 left-0 w-full h-full opacity-90 hover:opacity-100 transition-opacity duration-300"
                                      src={resource.url?.includes('youtube.com/watch') || resource.url?.includes('youtu.be') 
                                          ? `https://www.youtube.com/embed/${resource.url.split('v=')[1]?.split('&')[0] || resource.url.split('/').pop()}?rel=0`
                                          : `https://www.youtube.com/embed?listType=search&list=${encodeURIComponent(resource.title + " tutorial " + resource.platform)}`}
                                      title="Course Preview"
                                      frameBorder="0" 
                                      allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" 
                                      allowFullScreen
                                    ></iframe>
                                </div>
                             </div>
                             
                             <div className="bg-slate-900/50 p-5 rounded-xl border border-slate-800">
                                 <div className="flex items-center gap-2 text-slate-300 text-sm font-bold mb-2">
                                    <div className="p-1 bg-purple-900/20 rounded border border-purple-500/20">
                                        <svg className="w-3 h-3 text-purple-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                                    </div>
                                    Why this course?
                                 </div>
                                 <p className="text-slate-400 text-xs leading-relaxed text-justify">
                                    "This resource specifically addresses your identified gaps in <span className="text-purple-300 font-medium border-b border-purple-500/30">{resource.covered_concepts?.slice(0,2).join(' & ')}</span>."
                                 </p>
                             </div>
                          </div>
                      </div>
                   ))}
                       </div>
                     </div>
                   ))}
                   {groupedStrategyResources.length === 0 && (
                     <div className="rounded-2xl border border-slate-800 bg-slate-900/50 p-6 text-sm text-slate-400">
                       Recommendations are still being prepared. Refresh this page or reopen the learning plan if they do not appear in a few seconds.
                     </div>
                   )}
                   </div>

                   <button
                        onClick={() => {
                            clearAssessmentState(assessmentId);
                            navigate("/dashboard");
                        }}
                        className="self-center mt-12 px-8 py-3 bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white rounded-xl font-bold transition-all border border-slate-700 hover:border-slate-600 text-sm"
                    >
                        Return to Dashboard
                   </button>
                 </div>
                );
             })()}
            </motion.div>
        )}

      </div>
    </div>
  );
};

export default ProblemSolvingAssessment;
