import { useState, useEffect, useRef } from "react";
import { TeacherAgent } from "../agents/TeacherAgent";
import { motion, AnimatePresence } from "framer-motion";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { supabase } from "../lib/supabase";
import BackButton from "../components/ui/BackButton";
import { questionBank } from "../data/questionBank";
import { generateAssessment, saveAssessmentState, loadAssessmentState, clearAssessmentState } from "../utils/assessmentUtils";
import FormattedQuestion from "../components/FormattedQuestion";
import AgentSystemPanel from "../components/agents/AgentSystemPanel";
import { syncMasteryToSupabase } from "../utils/syncUtils";
import { recordLearningActivity } from "../utils/learningActivity";
import { getRecommendedResources, groupResourcesByCategory, normalizeStrategyPayload } from "../utils/roadmapRecommendations";
import { ensureQuestionHints } from "../utils/questionEnhancers";

/* ── Reusable SVG icon components ─────────────────────────────── */
const Icon = {
  Zap: (p) => (
    <svg {...p} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/>
    </svg>
  ),
  Cpu: (p) => (
    <svg {...p} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="4" y="4" width="16" height="16" rx="2" ry="2"/><rect x="9" y="9" width="6" height="6"/><line x1="9" y1="1" x2="9" y2="4"/><line x1="15" y1="1" x2="15" y2="4"/><line x1="9" y1="20" x2="9" y2="23"/><line x1="15" y1="20" x2="15" y2="23"/><line x1="20" y1="9" x2="23" y2="9"/><line x1="20" y1="15" x2="23" y2="15"/><line x1="1" y1="9" x2="4" y2="9"/><line x1="1" y1="15" x2="4" y2="15"/>
    </svg>
  ),
  Award: (p) => (
    <svg {...p} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="8" r="7"/><polyline points="8.21 13.89 7 23 12 20 17 23 15.79 13.88"/>
    </svg>
  ),
  ChevronRight: (p) => (
    <svg {...p} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="9 18 15 12 9 6"/>
    </svg>
  ),
  CheckCircle: (p) => (
    <svg {...p} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/>
    </svg>
  )
};



const Assessment = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const domain = searchParams.get("domain") || "dsa";
  const subtopic = searchParams.get("subtopic");
  const assessmentId = `concept_${domain}_${subtopic || 'all'}_v3`; // Unique ID for persistence
  const [questions, setQuestions] = useState([]);
  const [currentStep, setCurrentStep] = useState("intro"); // intro, assessment, evaluating, result
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [answers, setAnswers] = useState({});
  const [agentStatus, setAgentStatus] = useState("");
  const [score, setScore] = useState(0);
  const [level, setLevel] = useState("");
  const [analysis, setAnalysis] = useState(null);
  const [diagnosisResults, setDiagnosisResults] = useState([]);
  const [strategy, setStrategy] = useState(null);
  const [evaluationResults, setEvaluationResults] = useState({}); // Track AI evaluation correctness
  const [thinkingSteps, setThinkingSteps] = useState([]);
  const [reflectionText, setReflectionText] = useState("");
  const [aiReflectionResponse, setAiReflectionResponse] = useState("");
  const [isExplainingScore, setIsExplainingScore] = useState(false);
  const [badges, setBadges] = useState([]);
  const [streak, setStreak] = useState(0);
  const [xpEarned, setXpEarned] = useState(0);
  const [timeLeft, setTimeLeft] = useState(0);
  const [timerActive, setTimerActive] = useState(false);
  const [isTimedOut, setIsTimedOut] = useState(false);
  const [showHint, setShowHint] = useState(false);

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

  // Map domain param to questionBank keys
  const getQuestionBankDomain = (dom) => {
      switch(dom) {
          case 'dsa': return 'dsa_hard'; // Mapping DSA to dsa_hard for mastery
          case 'ml': return 'ml';
          case 'web': return 'web';
          case 'dbms': return 'dbms';
          case 'os': return 'os';
          case 'programming': return 'programming';
          default: return 'dsa_hard';
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
        
        // If they finished, show them the intro again OR the result if they prefer?
        // We'll show intro to allow a fresh start, while keeping results accessible in state if they bypass.
        if (savedState.currentStep === 'result' || savedState.currentStep === 'learning-plan' || savedState.currentStep === 'analysis') {
            setCurrentStep('intro');
        } else {
            setCurrentStep(savedState.currentStep || 'intro');
        }
        
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
        // Generate new assessment using bank if needed, but startAssessment will override
        const bankDomain = getQuestionBankDomain(domain);
        const newQuestions = generateAssessment(bankDomain, 10);
        setQuestions(ensureQuestionHints(newQuestions, topicLabel));
    }

  }, [domain, assessmentId]);


  // TIMER LOGIC
  useEffect(() => {
    if (currentStep === "assessment" && questions[currentQuestionIndex]) {
        const q = questions[currentQuestionIndex];
        const limit = q.time_limit || TeacherAgent.getTimeLimit(q.difficulty);
        setTimeLeft(limit);
        setTimerActive(true);
        setIsTimedOut(false);
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
          setIsTimedOut(true);
          // Auto-submit BEFORE moving to next
          if (!answers[currentQuestionIndex]) {
              handleAnswer("TIMEOUT");
          }
          setTimeout(() => nextQuestion(), 1000);
      }
      return () => clearInterval(interval);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [timerActive, timeLeft, currentQuestionIndex, answers]);


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
            strategy // persist strategy
        });
    }
  }, [questions, answers, currentQuestionIndex, currentStep, score, level, analysis, strategy, assessmentId]);

  // Build real-world curated resources based on topic for fallback
  const getFallbackCourses = (topic) => {
    const topicLower = (topic || '').toLowerCase();
    
    // DSA / Algorithms
    if (topicLower.includes('dsa') || topicLower.includes('struct') || topicLower.includes('algorithm') || topicLower.includes('recursion')) {
      return [
        { title: "NeetCode DSA Roadmap", platform: "NeetCode", url: "https://neetcode.io/roadmap", description: "The gold standard roadmap for tracking DSA progress from beginner to advanced. Includes video explanations.", covered_concepts: ["Arrays", "Sliding Window", "Binary Search", "Trees"] },
        { title: "Striver's SDE Sheet", platform: "take U forward", url: "https://takeuforward.org/interviews/strivers-sde-sheet-top-coding-interview-problems/", description: "A highly-curated set of 180+ problems commonly asked in top-tier tech interviews like Google and Amazon.", covered_concepts: ["Dynamic Programming", "Graphs", "Recursion", "Sorting"] },
        { title: "Abdul Bari – Algorithms Playlist", platform: "YouTube", url: "https://www.youtube.com/@abdul_bari/videos", description: "In-depth visual explanations of algorithmic techniques including greedy, divide & conquer, and complexity analysis.", covered_concepts: ["Asymptotic Notation", "Divide & Conquer", "Greedy Method"] }
      ];
    }
    
    // Web Development
    if (topicLower.includes('web') || topicLower.includes('react') || topicLower.includes('javascript') || topicLower.includes('node')) {
      return [
        { title: "The Odin Project – Full Stack JS", platform: "The Odin Project", url: "https://www.theodinproject.com/paths/full-stack-javascript", description: "A high-quality, free curriculum that teaches everything from basic HTML to advanced React and Node.js through projects.", covered_concepts: ["Full Stack", "React", "Node.js", "Express"] },
        { title: "React Official Documentation", platform: "React.dev", url: "https://react.dev/learn", description: "The definitive guide to learning React. Focus on the new 'Learn' section for modern best practices.", covered_concepts: ["Hooks", "Components", "State Management"] },
        { title: "MDN Web Docs – JS Guide", platform: "MDN", url: "https://developer.mozilla.org/en-US/docs/Web/JavaScript/Guide", description: "The most trusted reference for JavaScript. Essential for mastering core language mechanics.", covered_concepts: ["Asynchrounous JS", "Objects", "ES6+"] }
      ];
    }

    // Machine Learning / AI
    if (topicLower.includes('ml') || topicLower.includes('ai') || topicLower.includes('learning')) {
      return [
        { title: "Machine Learning Specialization – Andrew Ng", platform: "Coursera", url: "https://www.coursera.org/specializations/machine-learning-introduction", description: "The legendary course by Andrew Ng that introduces foundational ML concepts with mathematical intuition.", covered_concepts: ["Supervised Learning", "Regularization", "Neural Networks"] },
        { title: "StatQuest with Josh Starmer", platform: "YouTube", url: "https://www.youtube.com/@statquest", description: "Breaking down complex ML and statistical concepts into simple, visually-digestible pieces.", covered_concepts: ["Decision Trees", "SVM", "Probability", "Linear Regression"] },
        { title: "3Blue1Brown – Neural Networks", platform: "YouTube", url: "https://www.youtube.com/playlist?list=PLZHQObOWTQDNU6R1_67000Dx_ZCJB-3pi", description: "The most beautiful visual explanation of how neural networks actually work under the hood.", covered_concepts: ["Calculus", "Backpropagation", "Deep Learning"] }
      ];
    }

    // DBMS / SQL
    if (topicLower.includes('dbms') || topicLower.includes('sql') || topicLower.includes('database')) {
      return [
        { title: "SQLBolt – Interactive SQL", platform: "SQLBolt", url: "https://sqlbolt.com/", description: "A series of interactive lessons and exercises that help you learn SQL directly in your browser.", covered_concepts: ["SELECT Queries", "JOINs", "Aggregates"] },
        { title: "Khan Academy – Intro to SQL", platform: "Khan Academy", url: "https://www.khanacademy.org/computing/computer-programming/sql", description: "A friendly, beginner-focused course on manipulating data and building databases with SQL.", covered_concepts: ["Data Manipulation", "Schema Design", "Relational Databases"] }
      ];
    }
    
    // Operating Systems
    if (topicLower.includes('os') || topicLower.includes('operating') || topicLower.includes('linux')) {
        return [
          { title: "Neso Academy – Operating Systems", platform: "YouTube", url: "https://www.youtube.com/@nesoacademy/videos", description: "Clear, academic-style lectures covering every core detail required for university and interviews.", covered_concepts: ["Process Management", "Deadlocks", "Memory Management"] },
          { title: "Linux Journey", platform: "Linux Journey", url: "https://linuxjourney.com/", description: "The easiest and most structured way to learn the command line and Linux fundamentals.", covered_concepts: ["Shell", "File Systems", "Permissions"] }
        ];
    }

    // Generic Fallback
    return [
      { title: "GeeksforGeeks CS Guide", platform: "GeeksforGeeks", url: "https://www.geeksforgeeks.org/computer-science-projects/", description: "The ultimate reference guide for computer science students across all topics.", covered_concepts: ["Fundamentals", "Practice"] },
      { title: "freeCodeCamp Full Courses", platform: "YouTube", url: "https://www.youtube.com/c/Freecodecamp", description: "6-12 hour deep dives into almost any technical topic you can imagine.", covered_concepts: ["Bootcamp Style", "Projects"] }
    ];
  };

  // Fetch Strategy when entering learning-plan
  useEffect(() => {
    if (currentStep === 'learning-plan' && analysis && !hasUsableStrategy) {
        setAgentStatus("Strategy Agent: Curating personalized resources...");
        // 15s timeout to prevent infinite spinner
        const timeout = setTimeout(() => {
            console.warn("[Strategy] Timeout — applying fallback.");
            setStrategy(normalizeStrategyPayload({
                strategy_summary: `Focus on your weak areas in ${subtopic || domain} through consistent daily practice.`,
                daily_practice_tip: "Spend 30 minutes each day solving 2–3 focused problems on your weak topics.",
                recommended_courses: getRecommendedResources(topicLabel, analysis?.weak_concepts || []),
                session_goal: { primary_objective: analysis?.recommended_focus || 'Core Fundamentals', recommended_time_budget_minutes: 30 }
            }, strategyContext));
            setAgentStatus("");
        }, 15000);

        TeacherAgent.getStrategy(
            level, 
            analysis.weak_concepts || [], 
            topicLabel
        ).then(res => {
            clearTimeout(timeout);
            // If backend returns empty courses, enrich with fallbacks
            setStrategy(normalizeStrategyPayload(res, strategyContext));
            setAgentStatus("");
        }).catch(err => {
            clearTimeout(timeout);
            console.error("Strategy fetch failed", err);
            setStrategy(normalizeStrategyPayload({
                strategy_summary: `Focus on your weak areas in ${subtopic || domain} through consistent daily practice.`,
                daily_practice_tip: "Spend 30 minutes each day solving 2–3 focused problems on your weak topics.",
                recommended_courses: getRecommendedResources(topicLabel, analysis?.weak_concepts || []),
                session_goal: { primary_objective: analysis?.recommended_focus || 'Core Fundamentals', recommended_time_budget_minutes: 30 }
            }, strategyContext));
            setAgentStatus("");
        });
    }
   
  }, [currentStep, analysis, hasUsableStrategy, level, topicLabel, subtopic, domain]);



  // const [feedbackStep, setFeedbackStep] = useState(false); // Removed
  // const [feedbackType, setFeedbackType] = useState(""); // Removed

  const startAssessment = async () => {
    console.log('[Assessment] 🚀 Starting assessment, calling Teacher Agent...');
    setAgentStatus("Teacher Agent: Generating high-quality questions...");

    // Reset All Assessment State
    setAnswers({});
    setCurrentQuestionIndex(0);
    setScore(0);
    setLevel("");
    setAnalysis(null);
    setStrategy(null);
    setDiagnosisResults([]);
    setEvaluationResults({});
    setAiReflectionResponse("");
    setShowHint(false);

    const topic = subtopic ? `${subtopic} (${getDomainTitle()})` : (getDomainTitle() || domain);

    try {
        console.log(`[Assessment] 📞 Calling TeacherAgent.generateAssessment("${topic}", "intermediate", 5)`);
        
        const data = await TeacherAgent.generateAssessment(topic, "intermediate", [], {}, 5);
        
        console.log('[Assessment] 📦 Received response from Teacher Agent:', data);
        
        if (data.questions && Array.isArray(data.questions) && data.questions.length > 0) {
             console.log(`[Assessment] ✅ Setting ${data.questions.length} AI-generated questions`);
             setQuestions(ensureQuestionHints(data.questions, topic));
             if (data.thinking_steps) setThinkingSteps(data.thinking_steps);
             
             setCurrentStep("assessment");
             setAgentStatus("");
        } else {
             console.warn("[Assessment] ⚠️ AI response did not contain valid questions, using fallback");
             setAgentStatus("AI overloaded. Loading static curriculum...");
             const bankDomain = getQuestionBankDomain(domain);
             const fallbackQuestions = generateAssessment(bankDomain, 10);
             setQuestions(ensureQuestionHints(fallbackQuestions, topic));
             setCurrentStep("assessment");
             setTimeout(() => setAgentStatus(""), 3000);
        }
    } catch (_) {
        console.error("[Assessment] ❌ AI Generation Error, fallback to static:", _);
        setAgentStatus("Connection issue. Loading local questions...");
        const bankDomain = getQuestionBankDomain(domain);
        const fallbackQuestions = generateAssessment(bankDomain, 10);
        setQuestions(ensureQuestionHints(fallbackQuestions, topic));
        setCurrentStep("assessment");
        setTimeout(() => setAgentStatus(""), 3000);
    }
  };

  const handleAnswer = (answer) => {
    if (isTimedOut) return; // Prevent answering after timeout
    setAnswers({ ...answers, [currentQuestionIndex]: answer });
  };


  const nextQuestion = () => {
    // Evaluate when confirmed/moving to next
    const userAns = answers[currentQuestionIndex];
    if (userAns !== undefined) {
        const isCorrect = userAns === questions[currentQuestionIndex]?.ans;
        setEvaluationResults(prev => ({ ...prev, [currentQuestionIndex]: isCorrect }));
    }
    
    // Immediate transition
    if (currentQuestionIndex < questions.length - 1) {
        setCurrentQuestionIndex(prev => prev + 1);
      setShowHint(false);
    } else {
        submitAssessment();
    }
  };

  const submitAssessment = () => {
    setCurrentStep("evaluating");
    setAgentStatus("Evaluator Agent: Analyzing responses...");
    
    // Prevent any navigation during evaluation
    window.onbeforeunload = () => "Assessment in progress. Are you sure you want to leave?";
    
    setTimeout(() => {
      calculateResult();
    }, 2000);
  };

  const calculateResult = async () => {
    try {
        console.log("[Assessment] 🧮 Calculating results...");
        
        if (!questions || !Array.isArray(questions) || questions.length === 0) {
            console.warn("[Assessment] ⚠️ No questions found during calculation. Falling back to zero-score layout.");
            setScore(0);
            setLevel("Beginner");
            setCurrentStep("result");
            return;
        }

        let calculatedScore = 0;
        questions.forEach((q, index) => {
          if (evaluationResults && evaluationResults[index] !== undefined) {
            if (evaluationResults[index]) calculatedScore++;
          } else {
            if (answers && answers[index] === q.ans) calculatedScore++;
          }
        });

        const percentage = (calculatedScore / questions.length) * 100;
        // Set a preliminary level based on score thresholds (will be overridden by KG agent)
        let finalLevel = "Beginner";
        if (percentage > 70) finalLevel = "Advanced";
        else if (percentage >= 40) finalLevel = "Intermediate";

        setScore(percentage);
        setLevel(finalLevel);

        // ── Gamification (set early so result screen has it ready) ──
        if (user) {
           const calculatedStreak = 1;
           const earnedXP = Math.round(percentage * 5);
           const newBadges = [];
           if (percentage >= 90) newBadges.push({ name: "Master Mind", icon: "🏆", desc: "90%+ Accuracy" });
           if (percentage >= 70) newBadges.push({ name: "Advanced Learner", icon: "🎯", desc: "70%+ Score" });
           if (percentage > 0) newBadges.push({ name: `${getDomainTitle()} Explorer`, icon: "⭐", desc: "Completed assessment" });
           setStreak(calculatedStreak);
           setXpEarned(earnedXP);
           setBadges(newBadges);
        }

        // ── Transition to Knowledge Phase ──
        setAgentStatus("Knowledge Gap Agent: Analyzing proficiency...");
    let analysisData = null;
    let strategyData = null;
    
    try {
        const topic = subtopic ? `${subtopic} (${getDomainTitle()})` : (getDomainTitle() || domain);
        const result = await TeacherAgent.analyzeGap(questions, answers, topic);
        
        // Backend returns { analysis: {...}, strategy: {...} }
        if (!result) {
          throw new Error("No response from Knowledge Gap Agent");
        }
        
        analysisData = result.analysis || result.knowledge_gap;
        strategyData = result.strategy;
        
        if (!analysisData) {
          console.warn("[Assessment] Knowledge Gap Agent returned empty analysis");
          // Create fallback analysis
          analysisData = {
            proficiency_level: finalLevel,
            gap_analysis: `Based on your ${Math.round(percentage)}% score, you have a ${finalLevel.toLowerCase()} understanding of ${topic}.`,
            weak_concepts: [],
            strong_concepts: [],
            recommended_focus: "Continue practicing to strengthen your foundation",
            mastery_profile: {}
          };
        }
        
        setAnalysis(analysisData);
        
        if (strategyData) {
          setStrategy(strategyData);
        }
        
        // Override level with KG agent's authoritative proficiency_level
        if (analysisData?.proficiency_level) {
          setLevel(analysisData.proficiency_level);
        }
        
        console.log("[Assessment] ✅ Knowledge Gap Analysis complete:", analysisData);
        
    } catch (error) {
        console.error("[Assessment] ❌ Gap Analysis failed:", error);
        setAgentStatus("");
        
        // --- NEW Fallback: Extract from questions ---
        const missedConcepts = Array.from(new Set(
            questions.filter((_, i) => !evaluationResults[i] && (answers[i] !== undefined || answers[i] === null))
                     .map(q => q.topic || q.category || topic)
        )).filter(Boolean).slice(0, 3);
        
        const correctConcepts = Array.from(new Set(
            questions.filter((_, i) => evaluationResults[i])
                     .map(q => q.topic || q.category || topic)
        )).filter(Boolean).slice(0, 3);

        // Create comprehensive fallback
        analysisData = {
          proficiency_level: finalLevel,
          gap_analysis: `You scored ${Math.round(percentage)}% on this ${getDomainTitle()} assessment. The AI analysis service is temporarily unavailable, but I've identified your strengths and gaps based on the questions you answered.`,
          weak_concepts: missedConcepts,
          strong_concepts: correctConcepts,
          recommended_focus: missedConcepts.length > 0 
            ? `Review the fundamentals of ${missedConcepts.join(', ')} to improve your score.` 
            : "Continue practicing general fundamentals to maintain your proficiency.",
          mastery_profile: { [domain]: percentage / 100 },
          error: true
        };
        setAnalysis(analysisData);
    }
    
        setAgentStatus("");
        // ── Always route to "result" (proficiency dashboard) first ──
        setCurrentStep("result");
        window.onbeforeunload = null;

        // ── Background: Persist progress ──
        if (user && analysisData) {
           recordLearningActivity(user.id, {
              type: "concept_assessment_completed",
              title: `Completed ${getDomainTitle()} assessment`,
              points: Math.round(percentage * 5),
              score: Math.round(percentage),
           });
           syncMasteryToSupabase(user.id, analysisData || { mastery_profile: { [domain]: percentage / 100 } }).then(() => {
              setAgentStatus("");
           }).catch(err => {
              console.error("[Assessment] Supabase sync failed:", err);
           });
        }
    } catch (err) {
        console.error("[Assessment] 💥 Catastrophic calculation failure:", err);
        setAgentStatus("");
        setCurrentStep("result");
        // Minimum fallback for result screen to work
        if (!analysis) setAnalysis({ proficiency_level: "Beginner", gap_analysis: "An error occurred during calculation. Please try again.", weak_concepts: [], strong_concepts: [], mastery_profile: {}, error: true });
    }
  };

  const handleReflectionSubmit = async () => {
    setAgentStatus("AI Mirror: Analyzing your thinking process...");
    // Simulate AI reflection response
    setTimeout(() => {
        setAiReflectionResponse("That's a keen observation. Being aware of your cognitive gaps in " + (analysis?.weak_concepts?.[0] || "Foundations") + " is the first step toward mastery. I've adjusted your next roadmap to focus on this self-identified gap.");
        setAgentStatus("");
    }, 2000);
  };
  
  // Prevent accidental navigation during critical phases
  useEffect(() => {
    const criticalPhases = ["evaluating", "analysis"];
    if (criticalPhases.includes(currentStep)) {
      const handleBeforeUnload = (e) => {
        e.preventDefault();
        e.returnValue = "Assessment analysis in progress. Are you sure you want to leave?";
        return e.returnValue;
      };
      window.addEventListener("beforeunload", handleBeforeUnload);
      return () => window.removeEventListener("beforeunload", handleBeforeUnload);
    }
  }, [currentStep]);

  const getCoreSkills = () => {
    switch(domain) {
      case 'dsa': return ["Arrays", "Trees", "Graphs", "DP"];
      case 'ml': return ["Supervised", "Neural Nets", "NLP", "Python"];
      case 'web': return ["React", "Node.js", "CSS", "API Design"];
      case 'dbms': return ["SQL", "Normalization", "Indexing", "NoSQL"];
      case 'os': return ["Process Mgmt", "Threads", "Memory", "Linux"];
      case 'programming': return ["OOP", "Syntax", "Debugging", "Logic"];
      default: return ["Problem Solving", "Logic", "Optimization"];
    }
  };

  const getDomainTitle = () => {
    switch(domain) {
      case 'ml': return "Machine Learning";
      case 'programming': return "Programming";
      case 'web': return "Web Development";
      case 'dbms': return "DBMS";
      case 'os': return "Operating Systems";
      case 'serviceBased': return "Service-Based Prep";
      default: return "DSA";
    }
  };

  return (
    <div 
      className="min-h-screen bg-slate-950 text-white flex flex-col items-center justify-center p-6 relative overflow-hidden font-sans selection:bg-blue-500/30"
    >

      
      {/* Background Grid with Fade */}
      <div className="absolute inset-0 bg-[url('/grid.svg')] bg-center mask-[linear-gradient(180deg,white,rgba(255,255,255,0))] pointer-events-none opacity-50" />
      
      {/* Agent Status Bar */}
      <AnimatePresence>
        {agentStatus && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="fixed top-8 left-1/2 transform -translate-x-1/2 bg-bg-secondary/90 backdrop-blur-md border border-white/10 px-6 py-3 rounded-full shadow-2xl flex items-center gap-3 z-50"
          >
            <div className="w-2.5 h-2.5 bg-blue-400 rounded-full animate-pulse box-shadow-[0_0_10px_#60A5FA]" />
            <span className="text-sm font-semibold text-blue-100 tracking-wide font-mono">{agentStatus}</span>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="absolute top-8 left-8 z-50 flex gap-4">
         {(currentStep === "intro" || currentStep === "assessment") && (
           <>
             <button
                onClick={() => {
                  clearAssessmentState(assessmentId);
                  navigate('/');
                }}
                className="group flex items-center gap-2 px-4 py-2 bg-white/5 hover:bg-white/10 border border-white/10 hover:border-cyan-500/50 rounded-lg backdrop-blur-md text-text-secondary hover:text-cyan-400 transition-all duration-300"
             >
               <svg className="w-4 h-4 transform transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
               </svg>
               <span className="text-sm font-medium">Home</span>
             </button>
             <button
                onClick={() => {
                  clearAssessmentState(assessmentId);
                  navigate('/dashboard?mode=concept');
                }}
                className="group flex items-center gap-2 px-4 py-2 bg-white/5 hover:bg-white/10 border border-white/10 hover:border-cyan-500/50 rounded-lg backdrop-blur-md text-text-secondary hover:text-cyan-400 transition-all duration-300"
             >
               <svg className="w-4 h-4 transform group-hover:-translate-x-1 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                 <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
               </svg>
               <span className="text-sm font-medium">Exit Session</span>
             </button>
           </>
         )}
      </div>

      <div className="max-w-3xl w-full relative z-10">
        
        {currentStep === "intro" && (
          <motion.div 
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-4xl mx-auto mt-12 mb-12 relative cursor-default"
          >

            <div className="absolute -top-24 left-1/2 -translate-x-1/2 w-96 h-96 bg-blue-500/10 blur-[120px] rounded-full pointer-events-none" />
            
            <div className="text-center mb-16 relative z-10">
                <motion.div 
                  initial={{ scale: 0.8, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}
                  className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-blue-500/5 text-accent-primary text-[10px] font-black uppercase tracking-[0.2em] mb-8 border border-blue-500/20"
                >
                  <Icon.Zap className="w-3 h-3" />
                  Personalized Session
                </motion.div>
                <h1 className="text-6xl md:text-7xl font-black text-white mb-8 tracking-tighter capitalize leading-none">
                  {subtopic ? subtopic.replace('-', ' ') : getDomainTitle()}
                </h1>
                <p className="text-text-secondary text-xl max-w-2xl mx-auto leading-relaxed font-medium">
                  We've prepared these questions to help you master {subtopic ? subtopic.replace('-', ' ') : getDomainTitle()}.
                </p>
            </div>
            
            <div className="grid md:grid-cols-3 gap-6 mb-16 relative z-10">
                 {[
                   { label: "Objective", val: "Skill Mastery", icon: <Icon.Award className="w-4 h-4 text-accent-primary" /> },
                   { label: "Format", val: "Adaptive Learning", icon: <Icon.Cpu className="w-4 h-4 text-amber-400" /> },
                   { label: "Duration", val: "~8 Minutes", icon: <Icon.Zap className="w-4 h-4 text-indigo-400" /> }
                 ].map((stat, i) => (
                   <div key={i} className="p-6 rounded-3xl border border-border-primary bg-bg-secondary/40 backdrop-blur-xl group hover:border-blue-500/30 transition-all">
                      <div className="flex items-center gap-3 mb-4">
                        <div className="w-8 h-8 rounded-xl bg-slate-950 flex items-center justify-center border border-border-primary">{stat.icon}</div>
                        <span className="text-text-muted font-bold text-[10px] uppercase tracking-widest">{stat.label}</span>
                      </div>
                      <div className="text-white text-xl font-black tracking-tight">{stat.val}</div>
                   </div>
                 ))}
            </div>

            <div className="text-center relative z-10">
                <button
                  onClick={startAssessment}
                  disabled={!!agentStatus}
                  className={`group relative px-10 py-5 rounded-2xl font-black text-xl transition-all overflow-hidden ${!!agentStatus ? 'bg-slate-800 text-slate-500 cursor-not-allowed opacity-70' : 'bg-white text-slate-950 shadow-[0_20px_50px_rgba(255,255,255,0.1)] hover:shadow-[0_20px_50px_rgba(59,130,246,0.3)] hover:-translate-y-1 active:scale-95'}`}
                >
                  <div className="absolute inset-x-0 bottom-0 h-1 bg-blue-600 group-hover:h-full transition-all opacity-10" />
                  <span className="relative z-10 flex items-center gap-3">
                    {!!agentStatus ? 'Preparing AI Session...' : 'Begin Assessment'}
                    {!agentStatus && <Icon.ChevronRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />}
                  </span>
                </button>
                <div className="mt-8 text-[10px] text-slate-600 font-bold uppercase tracking-[0.3em] flex flex-col gap-2">
                   <span>AI-Powered Learning</span>
                   {agentStatus && <span className="text-blue-500 animate-pulse lowercase tracking-normal font-mono">This usually takes 5-10 seconds...</span>}
                </div>
            </div>

            <div className="relative z-10 mt-12">
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
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-3xl mx-auto bg-bg-secondary/60 backdrop-blur-2xl border border-border-primary p-6 md:p-10 rounded-[32px] shadow-2xl relative overflow-hidden cursor-default"
          >

             {/* Progress Bar */}
             <div className="absolute top-0 left-0 h-1.5 bg-bg-surface/50 w-full">
                <motion.div 
                    initial={{ width: 0 }}
                    animate={{ width: `${(currentQuestionIndex / questions.length) * 100}%` }}
                    className="h-full bg-blue-500 shadow-[0_0_15px_rgba(59,130,246,0.6)]"
                />
             </div>

            <div className="flex justify-between items-center mb-6 mt-2 border-b border-white/5 pb-4">
               <div className="flex flex-col gap-1">
                   <div className="flex items-center gap-2">
                       <span className="px-1.5 py-0.5 rounded bg-blue-500/10 text-accent-primary text-[9px] font-black uppercase tracking-[0.2em] border border-blue-500/20">
                          Question {currentQuestionIndex + 1} <span className="text-slate-600">/ {questions.length}</span>
                       </span>
                   </div>
                   <h3 className="text-xl md:text-2xl font-black text-white tracking-tighter uppercase">{subtopic || domain}</h3>
               </div>
 
               <div className="text-right flex items-center gap-8">
                   <div>
                       <div className="text-[10px] font-black text-slate-600 uppercase tracking-widest mb-1">Time Remaining</div>
                       <div className={`text-2xl font-black tabular-nums tracking-tighter ${timeLeft < 10 ? 'text-rose-500 animate-pulse' : 'text-white'}`}>
                          {Math.floor(timeLeft / 60)}:{String(timeLeft % 60).padStart(2, '0')}
                       </div>
                   </div>
                   <div className="w-px h-8 bg-white/5 self-end mb-1" />
                   <div>
                       <div className="text-[10px] font-black text-slate-600 uppercase tracking-widest mb-1">Progress</div>
                       <div className="flex flex-col gap-2 min-w-[100px] mt-1">
                          <div className="text-xs font-black text-white tracking-tighter text-left">
                             {Math.round((currentQuestionIndex / questions.length) * 100)}%
                          </div>
                          <div className="w-full h-1 bg-bg-surface rounded-full overflow-hidden">
                             <motion.div 
                                initial={{ width: 0 }}
                                animate={{ width: `${(currentQuestionIndex / questions.length) * 100}%` }}
                                className="h-full bg-blue-500 shadow-[0_0_10px_rgba(59,130,246,0.3)]"
                             />
                          </div>
                       </div>
                   </div>
                </div>
            </div>

            <div className="mb-6 max-h-[140px] overflow-y-auto pr-2 custom-scrollbar">
              <div className="text-text-muted text-[9px] font-black uppercase tracking-widest mb-2 sticky top-0 bg-bg-secondary/10 py-1">Question Context</div>
               <div className="text-base md:text-lg font-bold leading-tight text-slate-100 italic">
                 <FormattedQuestion text={questions[currentQuestionIndex]?.q} />
               </div>
               
               {/* Hint Trigger */}
               {questions[currentQuestionIndex]?.hint && (
                 <div className="mt-4 flex flex-col items-start gap-3">
                    <button 
                       onClick={() => setShowHint(!showHint)}
                       className="p-1 px-3 rounded-full bg-amber-500/10 border border-amber-500/20 text-amber-400 text-[10px] font-black uppercase tracking-widest hover:bg-amber-500/20 transition-all flex items-center gap-2"
                    >
                       <Icon.Zap className="w-3 h-3" />
                       {showHint ? 'Hide Hint' : 'Need a Hint?'}
                    </button>
                    <AnimatePresence>
                       {showHint && (
                          <motion.div 
                             initial={{ opacity: 0, x: -10 }}
                             animate={{ opacity: 1, x: 0 }}
                             exit={{ opacity: 0, x: -10 }}
                             className="text-amber-200/60 text-xs italic font-medium max-w-lg border-l-2 border-amber-500/30 pl-3 py-1"
                          >
                             💡 {questions[currentQuestionIndex]?.hint}
                          </motion.div>
                       )}
                    </AnimatePresence>
                 </div>
               )}
            </div>
 
             <div className="grid grid-cols-2 gap-4 mb-8">
               {questions[currentQuestionIndex]?.options.map((option, idx) => {
                 const isSelected = answers[currentQuestionIndex] === option;
                 return (
                   <button
                     key={idx}
                     onClick={() => handleAnswer(option)}
                     disabled={isTimedOut}
                     className={`w-full text-left p-4 rounded-xl border transition-all duration-300 flex items-center gap-4 group relative overflow-hidden h-full min-h-[70px]
                       ${isSelected
                         ? "bg-blue-600/10 border-blue-500 text-white shadow-[0_0_20px_rgba(59,130,246,0.1)]" 
                         : "bg-slate-950/40 border-border-primary text-text-secondary hover:border-slate-600 hover:text-slate-200"}
                       ${isTimedOut ? "opacity-50 cursor-not-allowed" : ""}`}
                   >
                     <div className={`w-5 h-5 rounded-full border flex items-center justify-center shrink-0 transition-all duration-300
                           ${isSelected 
                               ? 'border-blue-500 scale-110' 
                               : 'border-border-secondary group-hover:border-slate-500'}`}>
                           {isSelected && <div className="w-2.5 h-2.5 rounded-full bg-blue-500 shadow-[0_0_10px_rgba(59,130,246,0.8)]"/>}
                     </div>
                     <span className="text-sm font-bold tracking-tight leading-snug">{option}</span>
                     {isSelected && <div className="absolute right-3 opacity-10"><Icon.Zap className="w-6 h-6 text-blue-500" /></div>}
                   </button>
                 );
               })}
             </div>

             <div className="flex justify-between items-center pt-8 border-t border-white/5">
               <button
                 onClick={() => setCurrentQuestionIndex(prev => Math.max(0, prev - 1))}
                 disabled={currentQuestionIndex === 0}
                 className={`flex items-center gap-2 px-4 py-2 rounded-xl font-bold text-xs transition-all
                   ${currentQuestionIndex === 0 ? "opacity-0 pointer-events-none" : "text-text-secondary hover:text-white hover:bg-white/5"}`}
               >
                 <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg>
                 Previous
               </button>
               <div className="text-[9px] text-slate-600 font-mono font-bold uppercase tracking-widest">Targeting: {questions[currentQuestionIndex]?.concepts?.slice(0, 1) || "Core Logic"}</div>
               <button
                 onClick={nextQuestion}
                 disabled={!answers[currentQuestionIndex]}
                 className={`group flex items-center gap-3 px-6 py-3 rounded-xl font-black text-xs transition-all
                   ${answers[currentQuestionIndex] 
                     ? "bg-white text-slate-950 hover:bg-blue-50 shadow-xl active:scale-95" 
                     : "bg-bg-surface/50 text-slate-600 cursor-not-allowed border border-border-primary"}`}
               >
                 {currentQuestionIndex === questions.length - 1 ? "Finish Session" : "Next Question"}
                 <Icon.ChevronRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
               </button>
             </div>
           </motion.div>
         )}

        {/* ── EVALUATING STEP ─────────────────────────────── */}
        {currentStep === "evaluating" && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-2xl mx-auto flex flex-col items-center justify-center py-24 gap-10"
          >
            {/* Spinning brain icon */}
            <div className="relative w-24 h-24 flex items-center justify-center">
              <div className="absolute inset-0 rounded-full border-4 border-blue-500/20 border-t-blue-500 animate-spin" />
              <div className="absolute inset-3 rounded-full border-4 border-purple-500/20 border-b-purple-500 animate-spin" style={{ animationDirection: "reverse", animationDuration: "1.2s" }} />
              <svg className="w-8 h-8 text-white relative z-10" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
              </svg>
            </div>

            {/* Phase list */}
            <div className="w-full space-y-3">
              {[
                { label: "Evaluator Agent: Scoring responses", done: true },
                { label: "Knowledge Gap Agent: Proficiency analysis", done: agentStatus.includes("Knowledge") },
                { label: "Bayesian mastery model: Updating concept graph", done: false },
                { label: "Strategy Agent: Building your learning path", done: false },
              ].map((phase, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.3 }}
                  className={`flex items-center gap-3 px-5 py-3 rounded-xl border ${phase.done ? "border-blue-500/30 bg-blue-500/5" : "border-white/5 bg-white/2"}`}
                >
                  {phase.done ? (
                    <div className="w-5 h-5 rounded-full bg-blue-500/20 flex items-center justify-center shrink-0">
                      <svg className="w-3 h-3 text-blue-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" /></svg>
                    </div>
                  ) : (
                    <div className="w-5 h-5 rounded-full border border-white/10 flex items-center justify-center shrink-0">
                      <div className="w-1.5 h-1.5 rounded-full bg-slate-600 animate-pulse" />
                    </div>
                  )}
                  <span className={`text-sm font-medium ${phase.done ? "text-blue-200" : "text-slate-500"}`}>{phase.label}</span>
                </motion.div>
              ))}
            </div>

            <p className="text-text-muted text-xs font-mono uppercase tracking-widest animate-pulse">Calibrating your knowledge profile...</p>
          </motion.div>
        )}

        {/* ── RESULT STEP (Proficiency Dashboard) ─────────────── */}
        {currentStep === "result" && (
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-4xl mx-auto mt-8 mb-8 cursor-default"
          >
            {/* ─── Hero Score Banner ─── */}
            {(() => {
              const tier = score >= 90 ? "D" : score >= 70 ? "C" : score >= 40 ? "B" : "A";
              const tierMeta = {
                A: { label: "Critical Remediation", color: "red", desc: "Focus on foundational prerequisites", gradient: "from-red-950 to-slate-950", badge: "bg-red-500/20 text-red-300 border-red-500/30" },
                B: { label: "Targeted Reinforcement", color: "amber", desc: "Focus on your weakest identified concepts", gradient: "from-amber-950 to-slate-950", badge: "bg-amber-500/20 text-amber-300 border-amber-500/30" },
                C: { label: "Ready to Progress", color: "blue", desc: "You can move to the next curriculum topic", gradient: "from-blue-950 to-slate-950", badge: "bg-blue-500/20 text-blue-300 border-blue-500/30" },
                D: { label: "Acceleration Mode", color: "purple", desc: "You've mastered this topic — push further!", gradient: "from-purple-950 to-slate-950", badge: "bg-purple-500/20 text-purple-300 border-purple-500/30" },
              }[tier];
              const profLevel = analysis?.proficiency_level || level;
              const profColor = profLevel === "Advanced" ? "text-purple-300" : profLevel === "Intermediate" ? "text-blue-300" : "text-green-300";

              return (
                <>
                  {/* Score Hero */}
                  <div className={`relative overflow-hidden rounded-3xl bg-linear-to-br ${tierMeta.gradient} border border-white/5 p-8 md:p-12 mb-6 shadow-2xl`}>
                    {/* Decorative glow */}
                    <div className="absolute -top-16 -right-16 w-64 h-64 rounded-full bg-white/3 blur-3xl pointer-events-none" />
                    <div className="absolute -bottom-8 -left-8 w-48 h-48 rounded-full bg-white/2 blur-2xl pointer-events-none" />

                    <div className="relative z-10 flex flex-col md:flex-row items-center md:items-start gap-8">
                      {/* Score ring */}
                      <div className="shrink-0 flex flex-col items-center gap-3">
                        <div className="relative w-32 h-32">
                          <svg className="w-32 h-32 -rotate-90" viewBox="0 0 120 120">
                            <circle cx="60" cy="60" r="50" fill="none" stroke="rgba(255,255,255,0.05)" strokeWidth="10" />
                            <motion.circle
                              cx="60" cy="60" r="50" fill="none"
                              stroke={tier === "D" ? "#a855f7" : tier === "C" ? "#3b82f6" : tier === "B" ? "#f59e0b" : "#ef4444"}
                              strokeWidth="10" strokeLinecap="round"
                              strokeDasharray={`${2 * Math.PI * 50}`}
                              initial={{ strokeDashoffset: 2 * Math.PI * 50 }}
                              animate={{ strokeDashoffset: 2 * Math.PI * 50 * (1 - score / 100) }}
                              transition={{ duration: 1.5, ease: "easeOut" }}
                            />
                          </svg>
                          <div className="absolute inset-0 flex flex-col items-center justify-center">
                            <span className="text-3xl font-black text-white">{Math.round(score)}%</span>
                            <span className="text-[9px] text-slate-500 font-bold uppercase tracking-widest">Score</span>
                          </div>
                        </div>
                        {/* Tier badge */}
                        <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest border ${tierMeta.badge}`}>
                          Tier {tier}
                        </span>
                      </div>

                      {/* Text info */}
                      <div className="flex-1 text-center md:text-left">
                        <div className="text-[10px] text-slate-500 font-bold uppercase tracking-widest mb-2">Knowledge Gap Agent Assessment</div>
                        <h1 className={`text-4xl md:text-5xl font-black mb-2 ${profColor}`}>{profLevel}</h1>
                        <p className="text-slate-400 text-sm mb-4">{analysis?.proficiency_description || `Your current skill tier for ${topicLabel}.`}</p>

                        <div className={`inline-flex items-center gap-2 px-4 py-2 rounded-full border text-sm font-semibold ${tierMeta.badge}`}>
                          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" /></svg>
                          {tierMeta.label}: {tierMeta.desc}
                        </div>

                        {/* XP & Badges */}
                        {(xpEarned > 0 || badges.length > 0) && (
                          <div className="flex flex-wrap gap-3 mt-5">
                            <span className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-yellow-500/10 border border-yellow-500/20 text-yellow-300 text-xs font-bold">
                              ⚡ +{xpEarned} XP Earned
                            </span>
                            {badges.map((b, i) => (
                              <span key={i} className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white/5 border border-white/10 text-slate-300 text-xs font-bold">
                                {b.icon} {b.name}
                              </span>
                            ))}
                          </div>
                        )}
                      </div>

                      {/* Stats column */}
                      <div className="shrink-0 flex flex-col gap-3 min-w-[120px]">
                        {[
                          { label: "Correct", val: `${Math.round(score / 100 * questions.length)}/${questions.length}` },
                          { label: "Risk Level", val: analysis?.risk_level || "—" },
                          { label: "Streak", val: `${streak} 🔥` },
                        ].map((stat) => (
                          <div key={stat.label} className="bg-white/5 rounded-xl p-3 text-center border border-white/5">
                            <div className="text-white font-black text-lg">{stat.val}</div>
                            <div className="text-[9px] text-slate-500 font-bold uppercase tracking-widest">{stat.label}</div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* ─── Concept Grid ─── */}
                  <div className="grid md:grid-cols-2 gap-6 mb-6">
                    {/* Strong concepts */}
                    <div className="bg-bg-secondary/40 border border-border-primary rounded-2xl p-6">
                      <h3 className="text-xs font-black uppercase tracking-widest text-green-400 mb-4 flex items-center gap-2">
                        <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" /></svg>
                        Strengths
                      </h3>
                      <div className="flex flex-wrap gap-2">
                        {(analysis?.strong_concepts?.length > 0) ? (
                          analysis.strong_concepts.map((c, i) => (
                            <span key={i} className="px-2.5 py-1 bg-green-900/15 text-green-300 rounded-lg text-xs font-semibold border border-green-500/15 flex items-center gap-1.5">
                              <span className="w-1.5 h-1.5 rounded-full bg-green-400 shrink-0" />{c}
                            </span>
                          ))
                        ) : <span className="text-slate-600 text-xs italic">Completing baseline assessment...</span>}
                      </div>
                    </div>

                    {/* Weak concepts */}
                    <div className="bg-bg-secondary/40 border border-border-primary rounded-2xl p-6">
                      <h3 className="text-xs font-black uppercase tracking-widest text-red-400 mb-4 flex items-center gap-2">
                        <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                        Knowledge Gaps
                      </h3>
                      <div className="flex flex-wrap gap-2">
                        {(analysis?.weak_concepts?.length > 0) ? (
                          analysis.weak_concepts.map((c, i) => (
                            <span key={i} className="px-2.5 py-1 bg-red-900/15 text-red-300 rounded-lg text-xs font-semibold border border-red-500/15 flex items-center gap-1.5">
                              <span className="w-1.5 h-1.5 rounded-full bg-red-400 shrink-0" />{c}
                            </span>
                          ))
                        ) : <span className="text-slate-600 text-xs italic">All concepts appear solid!</span>}
                      </div>
                    </div>
                  </div>

                  {/* ─── Mastery Profile Bars ─── */}
                  {analysis?.mastery_profile && Object.keys(analysis.mastery_profile).length > 0 && (
                    <div className="bg-bg-secondary/40 border border-border-primary rounded-2xl p-6 mb-6">
                      <h3 className="text-xs font-black uppercase tracking-widest text-text-muted mb-5 flex items-center gap-2">
                        <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" /></svg>
                        Concept Mastery Profile (Bayesian)
                      </h3>
                      <div className="space-y-3">
                        {Object.entries(analysis.mastery_profile).map(([concept, prob]) => {
                          const pct = Math.round((prob || 0) * 100);
                          const barColor = pct >= 70 ? "bg-green-500" : pct >= 40 ? "bg-amber-500" : "bg-red-500";
                          const statusLabel = pct >= 70 ? "Strong" : pct >= 40 ? "Developing" : "Weak";
                          return (
                            <div key={concept} className="flex items-center gap-4">
                              <span className="text-xs text-slate-300 font-medium w-32 shrink-0 capitalize truncate">{concept.replace(/_/g, " ")}</span>
                              <div className="flex-1 h-2 bg-white/5 rounded-full overflow-hidden">
                                <motion.div
                                  initial={{ width: 0 }}
                                  animate={{ width: `${pct}%` }}
                                  transition={{ duration: 0.8, ease: "easeOut", delay: 0.1 }}
                                  className={`h-full rounded-full ${barColor} shadow-sm`}
                                />
                              </div>
                              <span className="text-xs text-slate-500 font-mono w-10 text-right">{pct}%</span>
                              <span className={`text-[9px] font-black uppercase tracking-wider w-16 text-right ${pct >= 70 ? "text-green-400" : pct >= 40 ? "text-amber-400" : "text-red-400"}`}>{statusLabel}</span>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}

                  {/* ─── Recommended Focus from KG Agent ─── */}
                  {analysis?.recommended_focus && (
                    <div className="bg-blue-950/20 border border-blue-500/10 rounded-2xl p-6 mb-6 flex items-start gap-4">
                      <div className="w-10 h-10 rounded-xl bg-blue-500/15 flex items-center justify-center shrink-0">
                        <svg className="w-5 h-5 text-blue-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" /></svg>
                      </div>
                      <div className="flex-1">
                        <span className="text-[10px] font-black uppercase tracking-widest text-blue-400/80 block mb-1">Knowledge Gap Agent → Recommended Next Focus</span>
                        <span className="text-white font-bold text-base">"{analysis.recommended_focus}"</span>
                        {analysis.recommendation_reason && (
                          <p className="text-slate-400 text-xs mt-1.5 leading-relaxed">{analysis.recommendation_reason}</p>
                        )}
                        {analysis.thinking_pattern && (
                          <p className="text-purple-300/70 text-xs mt-2 italic">🧠 Thinking pattern: {analysis.thinking_pattern}</p>
                        )}
                      </div>
                    </div>
                  )}

                  {/* ─── CTA Buttons ─── */}
                  <div className="flex flex-col sm:flex-row gap-4 justify-center">
                    {analysis ? (
                      <>
                        <button
                          onClick={() => setCurrentStep("analysis")}
                          className="group flex items-center justify-center gap-3 px-8 py-4 bg-white text-slate-950 rounded-2xl font-black text-base transition-all shadow-xl hover:-translate-y-0.5 hover:shadow-2xl active:scale-95"
                        >
                          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2" /></svg>
                          View Gap Analysis
                          <Icon.ChevronRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                        </button>
                        <button
                          onClick={() => setCurrentStep("learning-plan")}
                          className="flex items-center justify-center gap-2 px-8 py-4 bg-bg-secondary/60 text-slate-300 hover:text-white rounded-2xl font-bold text-base transition-all border border-border-primary hover:border-slate-500"
                        >
                          Learning Plan →
                        </button>
                        <button
                          onClick={() => {
                            clearAssessmentState(assessmentId);
                            setCurrentStep("intro");
                          }}
                          className="flex items-center justify-center gap-2 px-8 py-4 bg-amber-500/10 text-amber-500 hover:bg-amber-500/20 rounded-2xl font-bold text-base transition-all border border-amber-500/20"
                        >
                          Retake Assessment
                        </button>
                        {analysis.error && (
                          <div className="w-full text-center mt-4">
                            <p className="text-amber-400 text-[10px] font-bold uppercase tracking-widest bg-amber-500/5 py-2 rounded-lg border border-amber-500/10">
                              ⚠️ AI SERVICE OFFLINE. SHOWING LOCAL ANALYSIS.
                            </p>
                          </div>
                        )}
                      </>
                    ) : (
                      <div className="text-center">
                        <div className="inline-flex items-center gap-3 px-6 py-3 bg-amber-500/10 border border-amber-500/20 rounded-xl text-amber-300 text-sm">
                          <svg className="w-5 h-5 animate-spin" fill="none" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                          </svg>
                          <span className="font-medium">AI agents are analyzing your performance...</span>
                        </div>
                        <p className="text-xs text-slate-500 mt-3">This usually takes 5-10 seconds</p>
                      </div>
                    )}
                  </div>
                </>
              );
            })()}
          </motion.div>
        )}


        {currentStep === "analysis" && analysis && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-4xl mx-auto mt-8 bg-bg-primary rounded-2xl border border-border-primary p-8 shadow-xl"
          >
             {/* Header */}
             <div className="flex items-center justify-between mb-8 pb-6 border-b border-border-primary">
                <div>
                    <h2 className="text-2xl font-bold text-white mb-1">Knowledge Analysis</h2>
                    <p className="text-text-secondary text-sm">AI-driven insights into your performance.</p>
                </div>
                <div className="text-right">
                    <span className={`block px-3 py-1 rounded-md text-xs font-bold border uppercase tracking-wide mb-1
                        ${analysis.proficiency_level === 'Advanced' ? 'bg-purple-500/10 text-purple-300 border-purple-500/20' : 
                          analysis.proficiency_level === 'Intermediate' ? 'bg-blue-500/10 text-blue-300 border-blue-500/20' : 
                          'bg-green-500/10 text-green-300 border-green-500/20'
                        }`}>
                        {analysis.proficiency_level}
                    </span>
                    <span className="text-[10px] text-text-muted font-mono uppercase">Proficiency Level</span>
                </div>
             </div>

             <div className="grid md:grid-cols-3 gap-8 mb-8">
                {/* Visual Overview Column */}
                <div className="md:col-span-1 space-y-6">
                    <div>
                        <h3 className="text-text-muted text-xs font-bold uppercase tracking-wider mb-3">
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
                         <h3 className="text-text-muted text-xs font-bold uppercase tracking-wider mb-3">
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
                    <div className="bg-bg-secondary/50 border border-border-primary p-6 rounded-xl h-full">
                        <div className="flex items-center gap-2 mb-3">
                            <svg className="w-4 h-4 text-accent-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                            </svg>
                            <h3 className="text-slate-300 font-bold text-xs uppercase tracking-wider">Evaluation Summary</h3>
                        </div>
                        <p className="text-slate-300 text-sm leading-relaxed mb-6 border-l-2 border-border-secondary pl-4">
                            {analysis.gap_analysis}
                        </p>
                        
                        <div className="bg-blue-950/20 border border-blue-500/10 p-4 rounded-lg flex items-center gap-4">
                             <div className="flex-1">
                                <span className="block text-[10px] font-bold text-accent-primary/80 uppercase tracking-widest mb-1">Recommended Priority</span>
                                <span className="text-white font-medium text-sm">"{analysis.recommended_focus}"</span>
                            </div>
                        </div>
                    </div>
                </div>
             </div>

             {/* Deep Dive Diagnosis Section (Simplified) */}
             {diagnosisResults && diagnosisResults.length > 0 && (
                <div className="mb-8 border-t border-border-primary pt-8">
                    <h3 className="text-slate-300 font-bold text-sm uppercase tracking-wider mb-4">Mistake Analysis</h3>
                    <div className="space-y-3">
                        {diagnosisResults.map((diag, i) => (
                            <div key={i} className="bg-bg-secondary/30 p-4 border border-border-primary rounded-xl hover:border-border-secondary transition-colors">
                                <div className="flex flex-col gap-3">
                                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-2">
                                         <div className="flex items-center gap-2">
                                             <span className="text-red-400 font-mono text-xs px-1.5 py-0.5 bg-red-500/10 rounded-md">Mistake {i+1}</span>
                                             <span className="text-slate-300 text-sm font-medium line-clamp-1" title={diag.question}>{diag.question}</span>
                                         </div>
                                         {diag.prerequisite_needed && (
                                             <span className="px-2 py-0.5 bg-yellow-500/10 text-yellow-500 border border-yellow-500/20 rounded text-[10px] font-bold uppercase tracking-wide shrink-0 flex items-center gap-1">
                                                <svg className="w-3 h-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                                                    <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"></path>
                                                    <line x1="12" y1="9" x2="12" y2="13"></line>
                                                    <line x1="12" y1="17" x2="12.01" y2="17"></line>
                                                </svg>
                                                Prerequisite Gap
                                             </span>
                                        )}
                                    </div>
                                    
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs pl-0 md:pl-20">
                                        <div>
                                            <span className="text-text-muted font-bold mr-2">Root Cause:</span>
                                            <span className="text-text-secondary">{diag.root_cause}</span>
                                        </div>
                                        <div>
                                             <span className="text-text-muted font-bold mr-2">Core Miss:</span>
                                             <span className="text-purple-300">{diag.missing_concept}</span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            <div className="flex justify-center gap-6 mt-16">
                 <button
                   onClick={() => setCurrentStep("learning-plan")} 
                   className="bg-white text-slate-900 px-10 py-5 rounded-2xl font-bold text-lg transition-all shadow-xl hover:scale-[1.02] hover:bg-slate-50 hover:shadow-2xl"
                 >
                   View Recommended Resources
                 </button>
                 <button
                   onClick={() => setCurrentStep("result")} 
                   className="text-text-secondary px-8 py-5 rounded-2xl font-bold text-lg transition-all hover:text-white hover:bg-white/5 border border-transparent hover:border-white/10"
                 >
                   Back to Score
                 </button>
            </div>
          </motion.div>
        )}

        {currentStep === "learning-plan" && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            onClick={(e) => e.stopPropagation()}
            className="bg-bg-primary border border-white/5 p-10 md:p-14 rounded-4xl shadow-2xl text-center max-w-5xl mx-auto overflow-hidden relative"
          >
             {(() => {
                if (!strategy) {
                     return (
                        <div className="flex flex-col items-center justify-center p-20 space-y-6">
                            <div className="relative">
                                <div className="absolute inset-0 bg-blue-500 blur-xl opacity-20 animate-pulse"></div>
                                <div className="w-16 h-16 border-4 border-border-primary border-t-blue-500 rounded-full animate-spin relative z-10"></div>
                            </div>
                            <p className="text-text-secondary font-mono text-sm animate-pulse tracking-widest uppercase">Planning your path...</p>
                        </div>
                    );
                }

                return (
                  <div className="flex flex-col gap-8 text-left w-full">
                    {/* Strategy Summary */}
                    <div className="flex items-start gap-4 p-5 rounded-xl bg-blue-500/5 border border-blue-500/10">
                        <div className="w-8 h-8 rounded-lg bg-blue-500/15 flex items-center justify-center text-accent-primary shrink-0 mt-0.5">
                            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>
                        </div>
                        <div>
                            <p className="text-slate-300 text-sm leading-relaxed">{strategy.strategy_summary}</p>
                            {strategy.daily_practice_tip && (
                                <p className="text-accent-primary text-xs mt-2 font-medium">💡 {strategy.daily_practice_tip}</p>
                            )}
                        </div>
                    </div>

                    {/* Resources Header */}
                    <div className="flex items-center justify-between">
                        <h3 className="text-lg font-bold text-white">Recommended Resources</h3>
                        <span className="text-xs text-text-muted">{strategy.recommended_courses?.length || 0} curated for you</span>
                    </div>

                    {strategy.roadmap?.length > 0 && (
                        <div className="bg-white/2 rounded-2xl p-6 border border-white/5 backdrop-blur-sm lg:col-span-1">
                            <div className="flex items-center justify-between mb-5">
                                <h3 className="text-lg font-bold text-white">Personalized Roadmap</h3>
                                <span className="text-xs text-text-muted">{strategy.roadmap.length} phases</span>
                            </div>
                            <div className="grid gap-4 md:grid-cols-3">
                                {strategy.roadmap.map((step, index) => (
                                    <div key={`${step.phase}_${index}`} className="rounded-2xl border border-white/5 bg-white/2 p-4">
                                        <div className="text-[10px] font-black uppercase tracking-[0.24em] text-accent-primary">{step.phase}</div>
                                        <h4 className="mt-2 text-sm font-bold text-white">{step.title}</h4>
                                        <p className="mt-2 text-xs leading-6 text-text-secondary">{step.focus}</p>
                                        <p className="mt-3 text-xs font-medium text-slate-300">Do: {step.action}</p>
                                        <p className="mt-2 text-xs text-text-muted">Outcome: {step.outcome}</p>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Resource List */}
                    <div className="space-y-8">
                    {groupedStrategyResources.map((group) => (
                        <div key={group.category}>
                            <div className="flex items-center justify-between mb-4">
                                <h4 className="text-sm font-bold text-white">{group.category}</h4>
                                <span className="text-[11px] text-text-muted">{group.items.length} resource{group.items.length > 1 ? "s" : ""}</span>
                            </div>
                            <div className="flex flex-col divide-y divide-slate-800/60 rounded-2xl border border-white/5 bg-slate-950/20 px-2">
                    {group.items.map((resource, index) => {
                        const url = resource.url || "";
                        const isYoutube = url.includes('youtube.com') || url.includes('youtu.be');
                        let videoId = null;
                        
                        if (isYoutube) {
                            if (url.includes('v=')) {
                                videoId = url.split('v=')[1]?.split('&')[0];
                            } else if (url.includes('youtu.be/')) {
                                videoId = url.split('youtu.be/')[1]?.split('?')[0];
                            } else if (url.includes('embed/')) {
                                videoId = url.split('embed/')[1]?.split('?')[0];
                            }
                        }

                        const hasValidId = videoId && videoId.length > 5 && !videoId.includes('@') && videoId !== 'videos';
                        const thumbUrl = hasValidId ? `https://img.youtube.com/vi/${videoId}/mqdefault.jpg` : null;

                        return (
                            <div key={index} className="flex items-start gap-5 py-5 group">
                                {/* Thumbnail or Index */}
                                {thumbUrl ? (
                                    <div className="w-24 h-16 rounded-lg overflow-hidden shrink-0 bg-bg-surface border border-border-secondary">
                                        <img src={thumbUrl} alt={resource.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
                                    </div>
                                ) : (
                                    <div className="w-12 h-12 rounded-xl bg-bg-surface border border-border-secondary flex items-center justify-center text-text-muted font-bold text-[10px] shrink-0 uppercase tracking-wider">
                                        {group.category.includes("Certification") ? "Cert" : group.category.includes("Documentation") ? "Docs" : "Video"}
                                    </div>
                                )}

                                {/* Content */}
                                <div className="flex-1 min-w-0">
                                    <div className="flex items-center gap-2 mb-1">
                                        <span className="text-[10px] font-bold uppercase tracking-wider text-text-muted px-2 py-0.5 bg-bg-surface rounded-md">
                                            {resource.platform}
                                        </span>
                                        {resource.covered_concepts?.slice(0, 2).map((c, i) => (
                                            <span key={i} className="text-[10px] px-2 py-0.5 bg-blue-500/10 text-accent-primary rounded-md border border-blue-500/15">
                                                {c}
                                            </span>
                                        ))}
                                    </div>
                                    <h4 className="text-white font-semibold text-sm leading-snug mb-1 line-clamp-1 group-hover:text-blue-300 transition-colors">
                                        {resource.title}
                                    </h4>
                                    <p className="text-text-muted text-xs leading-relaxed line-clamp-2">
                                        {resource.description}
                                    </p>
                                </div>

                                {/* CTA */}
                                {resource.url && resource.url !== '#' ? (
                                    <a
                                        href={resource.url}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="shrink-0 inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-bg-surface hover:bg-blue-600 text-slate-300 hover:text-white text-xs font-semibold transition-all border border-border-secondary hover:border-blue-500"
                                    >
                                        Open
                                        <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M14 5l7 7m0 0l-7 7m7-7H3" /></svg>
                                    </a>
                                ) : (
                                    <span className="shrink-0 text-xs text-slate-600 px-3 py-2">No link</span>
                                )}
                            </div>
                        );
                    })}
                            </div>
                        </div>
                    ))}
                    {groupedStrategyResources.length === 0 && (
                        <div className="rounded-2xl border border-white/5 bg-slate-950/30 p-6 text-sm text-text-secondary">
                            Recommendations are still being prepared. Refresh this page or reopen the learning plan if they do not appear in a few seconds.
                        </div>
                    )}
                    
                    <div className="flex flex-wrap gap-4 mt-8">
                        <button
                             onClick={() => {
                                 clearAssessmentState(assessmentId);
                                 navigate("/dashboard");
                             }}
                             className="px-6 py-2.5 bg-transparent hover:bg-white/5 text-text-muted hover:text-white rounded-xl font-medium text-sm transition-all border border-border-primary hover:border-slate-600"
                         >
                             ← Return to Dashboard
                        </button>
                        <button
                             onClick={() => {
                                 clearAssessmentState(assessmentId);
                                 setCurrentStep("intro");
                             }}
                             className="px-6 py-3.5 bg-blue-500/10 hover:bg-blue-500/20 text-blue-400 rounded-xl font-bold text-sm transition-all border border-blue-500/20"
                         >
                             Retake Assessment
                        </button>
                    </div>
                    </div>

                  </div>
                 );
             })()}

          </motion.div>
        )}

      </div>
    </div>
  );
};

export default Assessment;
