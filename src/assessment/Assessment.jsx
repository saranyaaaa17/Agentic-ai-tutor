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
        // Generate new assessment
        const bankDomain = getQuestionBankDomain(domain);
        const newQuestions = generateAssessment(bankDomain, 10); // Generate 10 questions
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
          // Auto-submit or move next if timed out
          handleAnswer("TIMEOUT", false);
          setTimeout(() => nextQuestion(), 1000);
      }
      return () => clearInterval(interval);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [timerActive, timeLeft]);


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
    setAgentStatus("Teacher Agent: Generating custom questions...");

    // If using AI, we fetch fresh questions based on the domain
    try {
        const topic = subtopic ? `${subtopic} (${getDomainTitle()})` : (getDomainTitle() || domain);
        console.log(`[Assessment] 📞 Calling TeacherAgent.generateAssessment("${topic}", "intermediate")`);
        
        const data = await TeacherAgent.generateAssessment(topic, "intermediate", [], {}, 10);
        
        console.log('[Assessment] 📦 Received response from Teacher Agent:', data);
        
        if (data.questions && Array.isArray(data.questions) && data.questions.length > 0) {
             console.log(`[Assessment] ✅ Setting ${data.questions.length} AI-generated questions`);
             setQuestions(ensureQuestionHints(data.questions, topic));
             if (data.thinking_steps) setThinkingSteps(data.thinking_steps);
             // Clear any old answers if questions changed
             setAnswers({});
             setCurrentQuestionIndex(0);
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
    } finally {
        setTimeout(() => {
            setCurrentStep("assessment");
            // Clear status after delay
            setTimeout(() => setAgentStatus(""), 3000);
        }, 1000);
    }
  };

  const handleAnswer = (answer) => {
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
      } else {
        // Fallback: Check strictly if answer matches the stored correct option
        if (answers[index] === q.ans) {
          calculatedScore++;
        }
      }
    });


    const percentage = (calculatedScore / questions.length) * 100;
    let finalLevel = "Beginner";
    if (percentage > 60) finalLevel = "Advanced";
    else if (percentage >= 40) finalLevel = "Intermediate";

    setScore(percentage);
    setLevel(finalLevel);
    // Call Knowledge Gap Agent
    setAgentStatus("Knowledge Gap Agent: Analyzing proficiency...");
    let analysisData = null;
    try {
        const topic = subtopic ? `${subtopic} (${getDomainTitle()})` : (getDomainTitle() || domain);
        
        // 1. Bulk Gap Analysis
        const result = await TeacherAgent.analyzeGap(questions, answers, topic);
        const analysisData = result.analysis;
        setAnalysis(analysisData);
        setStrategy(result.strategy);
        if (analysisData?.proficiency_level) setLevel(analysisData.proficiency_level);

    } catch (_) {
        console.error("Gap Analysis failed", _);
    }
    setAgentStatus("");
    setCurrentStep("result");

    // Saving Progress
    if (user) {
       setAgentStatus("Updating your cognitive profile...");
       
       // Gamification Logic
       const calculatedStreak = 1; // Mock: In real app, fetch from Supabase
       const earnedXP = Math.round(percentage * 5); // 5 XP per 1% accuracy
       const newBadges = [];
       if (percentage >= 90) newBadges.push({ name: "Master Mind", icon: "🏆", desc: "90%+ Accuracy" });
       if (percentage > 0) newBadges.push({ name: `${getDomainTitle()} Beginner`, icon: "⭐", desc: "Completed first session" });

       setStreak(calculatedStreak);
       setXpEarned(earnedXP);
       setBadges(newBadges);

       recordLearningActivity({
          type: "concept_assessment_completed",
          title: `Completed ${getDomainTitle()} assessment`,
          points: earnedXP,
          score: Math.round(percentage),
       });

       syncMasteryToSupabase(user.id, analysisData || { mastery_profile: { [domain]: percentage / 100 } }).then(() => {
          setAgentStatus("");
       });
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
    <div className="min-h-screen bg-slate-950 text-white flex flex-col items-center justify-center p-6 relative overflow-hidden font-sans selection:bg-blue-500/30">
      
      {/* Background Grid with Fade */}
      <div className="absolute inset-0 bg-[url('/grid.svg')] bg-center mask-[linear-gradient(180deg,white,rgba(255,255,255,0))] pointer-events-none opacity-50" />
      
      {/* Agent Status Bar */}
      <AnimatePresence>
        {agentStatus && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="fixed top-8 left-1/2 transform -translate-x-1/2 bg-slate-900/90 backdrop-blur-md border border-white/10 px-6 py-3 rounded-full shadow-2xl flex items-center gap-3 z-50"
          >
            <div className="w-2.5 h-2.5 bg-blue-400 rounded-full animate-pulse box-shadow-[0_0_10px_#60A5FA]" />
            <span className="text-sm font-semibold text-blue-100 tracking-wide font-mono">{agentStatus}</span>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="absolute top-8 left-8 z-50 flex gap-4">
         <button
            onClick={() => {
              clearAssessmentState(assessmentId);
              navigate('/');
            }}
            className="group flex items-center gap-2 px-4 py-2 bg-white/5 hover:bg-white/10 border border-white/10 hover:border-cyan-500/50 rounded-lg backdrop-blur-md text-slate-400 hover:text-cyan-400 transition-all duration-300"
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
            className="group flex items-center gap-2 px-4 py-2 bg-white/5 hover:bg-white/10 border border-white/10 hover:border-cyan-500/50 rounded-lg backdrop-blur-md text-slate-400 hover:text-cyan-400 transition-all duration-300"
         >
           <svg className="w-4 h-4 transform group-hover:-translate-x-1 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor">
             <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
           </svg>
           <span className="text-sm font-medium">Exit Session</span>
         </button>
      </div>

      <div className="max-w-3xl w-full relative z-10">
        
        {currentStep === "intro" && (
          <motion.div 
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            className="w-full max-w-4xl mx-auto mt-12 mb-12 relative"
          >
            <div className="absolute -top-24 left-1/2 -translate-x-1/2 w-96 h-96 bg-blue-500/10 blur-[120px] rounded-full pointer-events-none" />
            
            <div className="text-center mb-16 relative z-10">
                <motion.div 
                  initial={{ scale: 0.8, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}
                  className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-blue-500/5 text-blue-400 text-[10px] font-black uppercase tracking-[0.2em] mb-8 border border-blue-500/20"
                >
                  <Icon.Zap className="w-3 h-3" />
                  Personalized Session
                </motion.div>
                <h1 className="text-6xl md:text-7xl font-black text-white mb-8 tracking-tighter capitalize leading-none">
                  {subtopic ? subtopic.replace('-', ' ') : getDomainTitle()}
                </h1>
                <p className="text-slate-400 text-xl max-w-2xl mx-auto leading-relaxed font-medium">
                  We've prepared these questions to help you master {subtopic ? subtopic.replace('-', ' ') : getDomainTitle()}.
                </p>
            </div>
            
            <div className="grid md:grid-cols-3 gap-6 mb-16 relative z-10">
                 {[
                   { label: "Objective", val: "Skill Mastery", icon: <Icon.Award className="w-4 h-4 text-blue-400" /> },
                   { label: "Format", val: "Adaptive Learning", icon: <Icon.Cpu className="w-4 h-4 text-amber-400" /> },
                   { label: "Duration", val: "~8 Minutes", icon: <Icon.Zap className="w-4 h-4 text-indigo-400" /> }
                 ].map((stat, i) => (
                   <div key={i} className="p-6 rounded-3xl border border-slate-800 bg-slate-900/40 backdrop-blur-xl group hover:border-blue-500/30 transition-all">
                      <div className="flex items-center gap-3 mb-4">
                        <div className="w-8 h-8 rounded-xl bg-slate-950 flex items-center justify-center border border-slate-800">{stat.icon}</div>
                        <span className="text-slate-500 font-bold text-[10px] uppercase tracking-widest">{stat.label}</span>
                      </div>
                      <div className="text-white text-xl font-black tracking-tight">{stat.val}</div>
                   </div>
                 ))}
            </div>

            <div className="text-center relative z-10">
                <button
                  onClick={startAssessment}
                  className="group relative px-10 py-5 bg-white text-slate-950 rounded-2xl font-black text-xl transition-all shadow-[0_20px_50px_rgba(255,255,255,0.1)] hover:shadow-[0_20px_50px_rgba(59,130,246,0.3)] hover:-translate-y-1 active:scale-95 overflow-hidden"
                >
                  <div className="absolute inset-x-0 bottom-0 h-1 bg-blue-600 group-hover:h-full transition-all opacity-10" />
                  <span className="relative z-10 flex items-center gap-3">
                    Begin Assessment
                    <Icon.ChevronRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                  </span>
                </button>
                <div className="mt-8 text-[10px] text-slate-600 font-bold uppercase tracking-[0.3em]">AI-Powered Learning</div>
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
            className="w-full max-w-3xl mx-auto bg-slate-900/60 backdrop-blur-2xl border border-slate-800 p-6 md:p-10 rounded-[32px] shadow-2xl relative overflow-hidden"
          >
             {/* Progress Bar */}
             <div className="absolute top-0 left-0 h-1.5 bg-slate-800/50 w-full">
                <motion.div 
                    initial={{ width: 0 }}
                    animate={{ width: `${((currentQuestionIndex + 1) / questions.length) * 100}%` }}
                    className="h-full bg-blue-500 shadow-[0_0_15px_rgba(59,130,246,0.6)]"
                />
             </div>

            <div className="flex justify-between items-center mb-6 mt-2 border-b border-white/5 pb-4">
               <div className="flex flex-col gap-1">
                   <div className="flex items-center gap-2">
                       <span className="px-1.5 py-0.5 rounded bg-blue-500/10 text-blue-400 text-[9px] font-black uppercase tracking-[0.2em] border border-blue-500/20">
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
                             {Math.round(((currentQuestionIndex + 1) / questions.length) * 100)}%
                          </div>
                          <div className="w-full h-1 bg-slate-800 rounded-full overflow-hidden">
                             <motion.div 
                                initial={{ width: 0 }}
                                animate={{ width: `${((currentQuestionIndex + 1) / questions.length) * 100}%` }}
                                className="h-full bg-blue-500 shadow-[0_0_10px_rgba(59,130,246,0.3)]"
                             />
                          </div>
                       </div>
                   </div>
                   <div className="w-px h-8 bg-white/5 self-end mb-1" />
                   <div>
                       <div className="text-[10px] font-black text-slate-600 uppercase tracking-widest mb-1">Accuracy</div>
                       <div className="flex flex-col gap-2 min-w-[100px] mt-1">
                          <div className="text-xs font-black text-white tracking-tighter text-left">
                             {(() => {
                                 const attempted = Object.keys(evaluationResults).length;
                                 if (attempted === 0) return "0%";
                                 const correct = Object.values(evaluationResults).filter(Boolean).length;
                                 return Math.round((correct / attempted) * 100) + "%";
                             })()}
                          </div>
                          <div className="w-full h-1 bg-slate-800 rounded-full overflow-hidden">
                             <motion.div 
                                initial={{ width: 0 }}
                                animate={{ width: (() => {
                                    const attempted = Object.keys(evaluationResults).length;
                                    if (attempted === 0) return "0%";
                                    const correct = Object.values(evaluationResults).filter(Boolean).length;
                                    return (correct / attempted) * 100 + "%";
                                })() }}
                                className="h-full bg-green-500 shadow-[0_0_10px_rgba(34,197,94,0.3)]"
                             />
                          </div>
                       </div>
                   </div>
                </div>
            </div>

            <div className="mb-6 max-h-[140px] overflow-y-auto pr-2 custom-scrollbar">
              <div className="text-slate-500 text-[9px] font-black uppercase tracking-widest mb-2 sticky top-0 bg-slate-900/10 py-1">Question Context</div>
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
                    className={`w-full text-left p-4 rounded-xl border transition-all duration-300 flex items-center gap-4 group relative overflow-hidden h-full min-h-[70px]
                      ${isSelected
                        ? "bg-blue-600/10 border-blue-500 text-white shadow-[0_0_20px_rgba(59,130,246,0.1)]" 
                        : "bg-slate-950/40 border-slate-800 text-slate-400 hover:border-slate-600 hover:text-slate-200"}`}
                  >
                    <div className={`w-5 h-5 rounded-full border flex items-center justify-center shrink-0 transition-all duration-300
                          ${isSelected 
                              ? 'border-blue-500 scale-110' 
                              : 'border-slate-700 group-hover:border-slate-500'}`}>
                          {isSelected && <div className="w-2.5 h-2.5 rounded-full bg-blue-500 shadow-[0_0_10px_rgba(59,130,246,0.8)]"/>}
                    </div>
                    <span className="text-sm font-bold tracking-tight leading-snug">{option}</span>
                    {isSelected && <div className="absolute right-3 opacity-10"><Icon.Zap className="w-6 h-6 text-blue-500" /></div>}
                  </button>
                );
              })}
            </div>

            <div className="flex justify-between items-center pt-8 border-t border-white/5">
              <div className="text-[9px] text-slate-600 font-mono font-bold uppercase tracking-widest">Targeting: {questions[currentQuestionIndex]?.concepts?.slice(0, 1) || "Core Logic"}</div>
              <button
                onClick={nextQuestion}
                disabled={!answers[currentQuestionIndex]}
                className={`group flex items-center gap-3 px-6 py-3 rounded-xl font-black text-xs transition-all
                  ${answers[currentQuestionIndex] 
                    ? "bg-white text-slate-950 hover:bg-blue-50 shadow-xl active:scale-95" 
                    : "bg-slate-800/50 text-slate-600 cursor-not-allowed border border-slate-800"}`}
              >
                {currentQuestionIndex === questions.length - 1 ? "Finish Session" : "Next Question"}
                <Icon.ChevronRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </button>
            </div>
          </motion.div>
        )}

        {currentStep === "evaluating" && (
          <div className="text-center py-20 px-8">
            <div className="relative w-20 h-20 mx-auto mb-8">
               <div className="absolute inset-0 border-2 border-slate-800 rounded-full" />
               <div className="absolute inset-0 border-2 border-blue-500 rounded-full border-t-transparent animate-spin" />
             </div>
             <h3 className="text-2xl font-bold mb-2 text-white">Analyzing Results</h3>
             <p className="text-slate-500 text-sm mb-8">Your AI Tutor is processing your responses...</p>
             
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
                      <span className="text-blue-500">[{i + 1}]</span>
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
            className="w-full max-w-4xl mx-auto bg-slate-900/60 backdrop-blur-2xl border border-white/5 p-12 md:p-16 rounded-[48px] shadow-3xl text-center relative overflow-hidden"
          >
            <div className="absolute inset-0 bg-linear-to-b from-blue-500/5 to-transparent pointer-events-none" />
            
            <div className="mb-14 relative z-10 flex flex-col items-center">
               <motion.div 
                 initial={{ y: 10, opacity: 0 }} animate={{ y: 0, opacity: 1 }}
                 className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-slate-950 text-slate-500 text-[9px] font-black uppercase tracking-[0.3em] mb-6 border border-white/5"
               >
                  <Icon.CheckCircle className="w-3 h-3 text-green-500" />
                  Session Complete
               </motion.div>
               <h2 className="text-6xl font-black text-white mb-4 tracking-tighter">Performance Profile</h2>
               
               {/* Gamification Bar */}
               <div className="flex gap-4 mb-8">
                  <div className="flex items-center gap-2 bg-amber-500/10 border border-amber-500/20 px-3 py-1.5 rounded-full">
                    <span className="text-sm">🔥</span>
                    <span className="text-xs font-black text-amber-500 uppercase">{streak} Session Streak</span>
                  </div>
                  <div className="flex items-center gap-2 bg-blue-500/10 border border-blue-500/20 px-3 py-1.5 rounded-full">
                    <span className="text-sm">⭐</span>
                    <span className="text-xs font-black text-blue-400 uppercase">+{xpEarned} XP Earned</span>
                  </div>
               </div>
            </div>
 
            <div className="grid md:grid-cols-3 gap-6 mb-12 relative z-10 text-left">
                {[
                  { label: "Final Score", val: `${Math.round(score)}%`, sub: `Accuracy Rate`, color: "blue" },
                  { label: "Proficiency", val: level, sub: "Calculated Skill Level", color: "indigo" },
                  { label: "Subject", val: subtopic || domain, sub: "Focus Area", color: "emerald" }
                ].map((stat, i) => (
                  <div key={i} className="bg-slate-950/50 p-8 rounded-[32px] border border-white/5 group hover:border-blue-500/20 transition-all">
                    <span className="text-slate-600 text-[10px] font-black uppercase tracking-[0.2em] block mb-4">{stat.label}</span>
                    <div className="text-3xl font-black text-white mb-2 truncate tracking-tight">{stat.val}</div>
                    <div className={`text-[10px] font-bold uppercase tracking-widest ${stat.color === 'emerald' ? 'text-emerald-500' : 'text-blue-500'}`}>{stat.sub}</div>
                  </div>
                ))}
            </div>

            {/* Achievement Unlocked */}
            {badges.length > 0 && (
              <motion.div 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="mb-12 p-6 bg-linear-to-br from-blue-600/10 to-transparent border border-blue-500/20 rounded-[32px] text-left relative overflow-hidden"
              >
                <div className="absolute top-0 right-0 p-8 opacity-10">
                   <Icon.Award className="w-24 h-24 text-blue-400" />
                </div>
                <h3 className="text-[10px] font-black text-blue-400 uppercase tracking-[0.3em] mb-4">🏆 Achievement Unlocked</h3>
                <div className="flex items-center gap-4">
                  <div className="text-4xl">{badges[0].icon}</div>
                  <div>
                    <div className="text-xl font-black text-white">{badges[0].name}</div>
                    <div className="text-xs text-slate-500 font-medium">{badges[0].desc}</div>
                  </div>
                </div>
              </motion.div>
            )}

            {/* AI Reflection Section */}
            {!aiReflectionResponse ? (
              <div className="mb-12 p-8 bg-slate-950/40 border border-white/5 rounded-[32px] text-left">
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-8 h-8 rounded-full bg-blue-500/20 flex items-center justify-center">
                    <Icon.Cpu className="w-4 h-4 text-blue-400" />
                  </div>
                  <h3 className="text-sm font-black text-white uppercase tracking-widest">AI Reflection Mode</h3>
                </div>
                <p className="text-slate-400 text-sm mb-6 leading-relaxed">
                  "I noticed you struggled with {analysis?.weak_concepts?.[0] || 'some logical nuances'}. Thinking back to those questions, why do you think your reasoning diverged from the correct path?"
                </p>
                <textarea 
                  value={reflectionText}
                  onChange={(e) => setReflectionText(e.target.value)}
                  placeholder="Analyze your thinking process here..."
                  className="w-full bg-black/40 border border-white/10 rounded-2xl p-4 text-sm text-white placeholder:text-slate-600 focus:border-blue-500/50 transition-all outline-none min-h-[100px] mb-4"
                />
                <button 
                  onClick={handleReflectionSubmit}
                  disabled={!reflectionText}
                  className="px-6 py-2.5 bg-blue-600 hover:bg-blue-500 disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-xl text-xs font-black uppercase tracking-widest transition-all"
                >
                  Submit Reflection
                </button>
              </div>
            ) : (
              <motion.div 
                initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                className="mb-12 p-8 bg-blue-500/5 border border-blue-500/20 rounded-[32px] text-left"
              >
                <div className="flex items-center gap-3 mb-4">
                   <div className="text-xl">🧠</div>
                   <h3 className="text-sm font-black text-blue-400 uppercase tracking-widest">Thought Feedback</h3>
                </div>
                <p className="text-slate-300 text-sm leading-relaxed italic">
                  "{aiReflectionResponse}"
                </p>
              </motion.div>
            )}

            {/* Next Step Section */}
            <div className={`mb-12 p-8 border border-white/10 rounded-[32px] bg-slate-950/20 text-left flex items-center justify-between group cursor-pointer hover:border-blue-500/40 transition-all ${!analysis?.recommended_focus ? 'opacity-50 pointer-events-none' : ''}`}
                 onClick={() => {
                   if (!analysis?.recommended_focus) return;
                   const next = analysis.recommended_focus.toLowerCase().replace(/\s+/g, '-').replace(/[()]/g, '');
                   clearAssessmentState(assessmentId);
                   navigate(`/assessment?domain=${domain}&subtopic=${next}`);
                 }}
            >
              <div>
                 <h4 className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] mb-2">Next Recommended Topic</h4>
                 <div className="text-xl font-black text-white group-hover:text-blue-400 transition-colors">{analysis?.recommended_focus || "Advanced Mastery"}</div>
              </div>
              <div className="w-12 h-12 rounded-2xl bg-slate-900 border border-white/10 flex items-center justify-center text-blue-400 group-hover:bg-blue-600 group-hover:text-white transition-all shadow-xl group-hover:scale-110">
                 <Icon.Zap className="w-5 h-5" />
              </div>
            </div>
 
            <div className="flex gap-4 justify-center flex-wrap relative z-10">
              <button
                onClick={() => {
                  clearAssessmentState(assessmentId);
                  navigate("/dashboard?mode=concept");
                }}
                className="px-8 py-4 rounded-2xl font-black text-sm text-slate-500 hover:text-white hover:bg-white/5 border border-transparent hover:border-white/10 transition-all uppercase tracking-widest"
              >
                Exit Session
              </button>

              <button
                onClick={() => setIsExplainingScore(true)} 
                className="flex items-center gap-3 bg-slate-950 hover:bg-black text-blue-400 border border-blue-500/20 px-8 py-4 rounded-2xl font-black text-sm transition-all shadow-xl uppercase tracking-widest"
              >
                🧠 Explain My Score
              </button>
              
              <button
                onClick={() => setCurrentStep("learning-plan")} 
                className="px-10 py-4 bg-white text-slate-950 rounded-2xl font-black text-sm transition-all shadow-[0_0_30px_rgba(255,255,255,0.1)] hover:bg-blue-50 uppercase tracking-widest"
              >
                Get Roadmap
              </button>
            </div>

            {/* Explain Score Modal/Overlay */}
            <AnimatePresence>
               {isExplainingScore && (
                 <motion.div 
                    initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                    className="fixed inset-0 z-100 flex items-center justify-center p-6 bg-black/80 backdrop-blur-sm"
                 >
                    <motion.div 
                       initial={{ scale: 0.9, y: 20 }} animate={{ scale: 1, y: 0 }}
                       className="w-full max-w-2xl bg-slate-900 border border-slate-800 rounded-[40px] p-8 md:p-12 relative overflow-hidden shadow-4xl text-left"
                    >
                       <button onClick={() => setIsExplainingScore(false)} className="absolute top-8 right-8 text-slate-500 hover:text-white transition-colors">
                          <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                       </button>
                       <h3 className="text-3xl font-black text-white mb-2 tracking-tight">Performance Breakdown</h3>
                       <p className="text-slate-400 text-sm mb-8">Detailed analysis of your {Math.round(score)}% score.</p>
                       
                       <div className="space-y-6 mb-10">
                          <div className="p-5 rounded-2xl bg-slate-950 border border-white/5">
                             <div className="flex items-center justify-between mb-4">
                                <span className="text-xs font-black text-red-400 uppercase tracking-widest">Logic Errors</span>
                                <span className="text-lg font-black text-white">3</span>
                             </div>
                             <p className="text-[11px] text-slate-400 leading-relaxed font-medium">
                                You missed questions involving edge cases in {analysis?.weak_concepts?.[0] || 'Core Logic'}. This indicates a tendency to overlook boundary conditions.
                             </p>
                          </div>
                          
                          <div className="p-5 rounded-2xl bg-slate-950 border border-white/5">
                             <div className="flex items-center justify-between mb-4">
                                <span className="text-xs font-black text-amber-400 uppercase tracking-widest">Concept Gaps</span>
                                <span className="text-lg font-black text-white">2</span>
                             </div>
                             <p className="text-[11px] text-slate-400 leading-relaxed font-medium">
                                Shaky foundations in memory management were noted. Revisit the "Big O" complexity section to solidify these concepts.
                             </p>
                          </div>
                       </div>
                       
                       <div className="p-6 bg-blue-500/10 rounded-2xl border border-blue-500/20">
                          <div className="flex items-center gap-2 mb-2">
                             <span className="text-blue-400">💡</span>
                             <span className="text-[10px] font-black text-blue-400 uppercase tracking-widest">Core Recommendation</span>
                          </div>
                          <p className="text-xs text-blue-100 leading-relaxed">
                            Revise fundamentals in {analysis?.weak_concepts?.[0] || 'Data Structures'} before attempting the next advanced assessment.
                          </p>
                       </div>
                    </motion.div>
                 </motion.div>
               )}
            </AnimatePresence>
          </motion.div>
        )}

        {currentStep === "analysis" && analysis && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="w-full max-w-4xl mx-auto mt-8 bg-[#0A1120] rounded-2xl border border-slate-800 p-8 shadow-xl"
          >
             {/* Header */}
             <div className="flex items-center justify-between mb-8 pb-6 border-b border-slate-800">
                <div>
                    <h2 className="text-2xl font-bold text-white mb-1">Knowledge Analysis</h2>
                    <p className="text-slate-400 text-sm">AI-driven insights into your performance.</p>
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
                            <svg className="w-4 h-4 text-blue-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                            </svg>
                            <h3 className="text-slate-300 font-bold text-xs uppercase tracking-wider">Evaluation Summary</h3>
                        </div>
                        <p className="text-slate-300 text-sm leading-relaxed mb-6 border-l-2 border-slate-700 pl-4">
                            {analysis.gap_analysis}
                        </p>
                        
                        <div className="bg-blue-950/20 border border-blue-500/10 p-4 rounded-lg flex items-center gap-4">
                             <div className="flex-1">
                                <span className="block text-[10px] font-bold text-blue-400/80 uppercase tracking-widest mb-1">Recommended Priority</span>
                                <span className="text-white font-medium text-sm">"{analysis.recommended_focus}"</span>
                            </div>
                        </div>
                    </div>
                </div>
             </div>

             {/* Deep Dive Diagnosis Section (Simplified) */}
             {diagnosisResults && diagnosisResults.length > 0 && (
                <div className="mb-8 border-t border-slate-800 pt-8">
                    <h3 className="text-slate-300 font-bold text-sm uppercase tracking-wider mb-4">Mistake Analysis</h3>
                    <div className="space-y-3">
                        {diagnosisResults.map((diag, i) => (
                            <div key={i} className="bg-slate-900/30 p-4 border border-slate-800 rounded-xl hover:border-slate-700 transition-colors">
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
                                            <span className="text-slate-500 font-bold mr-2">Root Cause:</span>
                                            <span className="text-slate-400">{diag.root_cause}</span>
                                        </div>
                                        <div>
                                             <span className="text-slate-500 font-bold mr-2">Core Miss:</span>
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
                   className="text-slate-400 px-8 py-5 rounded-2xl font-bold text-lg transition-all hover:text-white hover:bg-white/5 border border-transparent hover:border-white/10"
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
            className="bg-[#0A1120] border border-white/5 p-10 md:p-14 rounded-4xl shadow-2xl text-center max-w-5xl mx-auto overflow-hidden relative"
          >
             {(() => {
                if (!strategy) {
                     return (
                        <div className="flex flex-col items-center justify-center p-20 space-y-6">
                            <div className="relative">
                                <div className="absolute inset-0 bg-blue-500 blur-xl opacity-20 animate-pulse"></div>
                                <div className="w-16 h-16 border-4 border-slate-800 border-t-blue-500 rounded-full animate-spin relative z-10"></div>
                            </div>
                            <p className="text-slate-400 font-mono text-sm animate-pulse tracking-widest uppercase">Planning your path...</p>
                        </div>
                    );
                }

                return (
                  <div className="flex flex-col gap-8 text-left w-full">
                    {/* Strategy Summary */}
                    <div className="flex items-start gap-4 p-5 rounded-xl bg-blue-500/5 border border-blue-500/10">
                        <div className="w-8 h-8 rounded-lg bg-blue-500/15 flex items-center justify-center text-blue-400 shrink-0 mt-0.5">
                            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>
                        </div>
                        <div>
                            <p className="text-slate-300 text-sm leading-relaxed">{strategy.strategy_summary}</p>
                            {strategy.daily_practice_tip && (
                                <p className="text-blue-400 text-xs mt-2 font-medium">💡 {strategy.daily_practice_tip}</p>
                            )}
                        </div>
                    </div>

                    {/* Resources Header */}
                    <div className="flex items-center justify-between">
                        <h3 className="text-lg font-bold text-white">Recommended Resources</h3>
                        <span className="text-xs text-slate-500">{strategy.recommended_courses?.length || 0} curated for you</span>
                    </div>

                    {strategy.roadmap?.length > 0 && (
                        <div className="rounded-2xl border border-white/5 bg-slate-950/30 p-6">
                            <div className="flex items-center justify-between mb-5">
                                <h3 className="text-lg font-bold text-white">Personalized Roadmap</h3>
                                <span className="text-xs text-slate-500">{strategy.roadmap.length} phases</span>
                            </div>
                            <div className="grid gap-4 md:grid-cols-3">
                                {strategy.roadmap.map((step, index) => (
                                    <div key={`${step.phase}_${index}`} className="rounded-2xl border border-white/5 bg-white/[0.02] p-4">
                                        <div className="text-[10px] font-black uppercase tracking-[0.24em] text-blue-400">{step.phase}</div>
                                        <h4 className="mt-2 text-sm font-bold text-white">{step.title}</h4>
                                        <p className="mt-2 text-xs leading-6 text-slate-400">{step.focus}</p>
                                        <p className="mt-3 text-xs font-medium text-slate-300">Do: {step.action}</p>
                                        <p className="mt-2 text-xs text-slate-500">Outcome: {step.outcome}</p>
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
                                <span className="text-[11px] text-slate-500">{group.items.length} resource{group.items.length > 1 ? "s" : ""}</span>
                            </div>
                            <div className="flex flex-col divide-y divide-slate-800/60 rounded-2xl border border-white/5 bg-slate-950/20 px-2">
                    {group.items.map((resource, index) => {
                        const isYoutube = resource.url?.includes('youtube.com') || resource.url?.includes('youtu.be');
                        const videoId = isYoutube
                            ? (resource.url.split('v=')[1]?.split('&')[0] || resource.url.split('/').pop())
                            : null;
                        const thumbUrl = videoId ? `https://img.youtube.com/vi/${videoId}/mqdefault.jpg` : null;

                        return (
                            <div key={index} className="flex items-start gap-5 py-5 group">
                                {/* Thumbnail or Index */}
                                {thumbUrl ? (
                                    <div className="w-24 h-16 rounded-lg overflow-hidden shrink-0 bg-slate-800 border border-slate-700">
                                        <img src={thumbUrl} alt={resource.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
                                    </div>
                                ) : (
                                    <div className="w-12 h-12 rounded-xl bg-slate-800 border border-slate-700 flex items-center justify-center text-slate-500 font-bold text-[10px] shrink-0 uppercase tracking-wider">
                                        {group.category.includes("Certification") ? "Cert" : group.category.includes("Documentation") ? "Docs" : "Video"}
                                    </div>
                                )}

                                {/* Content */}
                                <div className="flex-1 min-w-0">
                                    <div className="flex items-center gap-2 mb-1">
                                        <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 px-2 py-0.5 bg-slate-800 rounded-md">
                                            {resource.platform}
                                        </span>
                                        {resource.covered_concepts?.slice(0, 2).map((c, i) => (
                                            <span key={i} className="text-[10px] px-2 py-0.5 bg-blue-500/10 text-blue-400 rounded-md border border-blue-500/15">
                                                {c}
                                            </span>
                                        ))}
                                    </div>
                                    <h4 className="text-white font-semibold text-sm leading-snug mb-1 line-clamp-1 group-hover:text-blue-300 transition-colors">
                                        {resource.title}
                                    </h4>
                                    <p className="text-slate-500 text-xs leading-relaxed line-clamp-2">
                                        {resource.description}
                                    </p>
                                </div>

                                {/* CTA */}
                                {resource.url && resource.url !== '#' ? (
                                    <a
                                        href={resource.url}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="shrink-0 inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-slate-800 hover:bg-blue-600 text-slate-300 hover:text-white text-xs font-semibold transition-all border border-slate-700 hover:border-blue-500"
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
                        <div className="rounded-2xl border border-white/5 bg-slate-950/30 p-6 text-sm text-slate-400">
                            Recommendations are still being prepared. Refresh this page or reopen the learning plan if they do not appear in a few seconds.
                        </div>
                    )}
                    </div>

                    <button
                         onClick={() => {
                             clearAssessmentState(assessmentId);
                             navigate("/dashboard");
                         }}
                         className="self-start mt-4 px-6 py-2.5 bg-transparent hover:bg-white/5 text-slate-500 hover:text-white rounded-xl font-medium text-sm transition-all border border-slate-800 hover:border-slate-600"
                     >
                         ← Return to Dashboard
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

export default Assessment;
