import { useState, useEffect, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { companyConfig } from "../lib/companyConfig";
import { generateAssessment as generateStaticAssessment, loadAssessmentState, saveAssessmentState, clearAssessmentState } from "../utils/assessmentUtils";
import { getRandomFact } from "../data/learningFacts";
import { TeacherAgent } from "../agents/TeacherAgent";
import AgentSystemPanel from "../components/agents/AgentSystemPanel";
import FloatingCalculator from "../components/ui/FloatingCalculator";
import { ensureQuestionHints } from "../utils/questionEnhancers";

const ServiceBasedAssessment = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const companyId = searchParams.get("company") || "tcs";
  
  // Load Config
  const config = companyConfig[companyId];

  const STORAGE_KEY = `assessment_service_${companyId}_${user?.id}_v2`;

  const [step, setStep] = useState("intro"); 

  const [questionsDB, setQuestionsDB] = useState({});
  const [activeSection, setActiveSection] = useState("quant");
  const [answers, setAnswers] = useState({});
  const [visibleHints, setVisibleHints] = useState({});
  const [timeLeft, setTimeLeft] = useState(config.timeLimit);
  const [agentMessage, setAgentMessage] = useState("");
  
  // Results
  const [tier, setTier] = useState("");
  const [readinessScore, setReadinessScore] = useState(0);
  const [domainScores, setDomainScores] = useState({});
  const [analysis, setAnalysis] = useState(null);
  const [diagnosisResults, setDiagnosisResults] = useState([]);

  // Helper to fetch questions (AI with fallback)
  const fetchQuestions = async () => {
     const newDB = {};
     const domains = ["quant", "logical", "verbal", "programming", "cs"];
     const countPerDomain = Math.floor(10 / domains.length); // 2 questions per domain for quick demo

     setAgentMessage("Teacher Agent: Curating domain-specific challenges...");
     
     // Parallel fetch for speed
     await Promise.all(domains.map(async (domain) => {
        try {
            // Map simple domain keys to more descriptive topics for the AI
            const topicMap = {
                "quant": "Quantitative Aptitude Math",
                "logical": "Logical Reasoning Puzzles",
                "verbal": "Verbal Ability and English",
                "programming": "Computer Programming Concepts",
                "cs": "Computer Science Fundamentals"
            };
            
            const data = await TeacherAgent.generateAssessment(topicMap[domain], "intermediate", [], {}, countPerDomain);
             
            if (data.questions && data.questions.length > 0) {
                 // Take only needed count, ensuring we don't overflow
                 newDB[domain] = ensureQuestionHints(data.questions.slice(0, countPerDomain), topicMap[domain]);
            } else {
                 throw new Error("No questions from agent");
            }
        } catch (err) {
            console.warn(`Agent failed for ${domain}, using static fallback.`);
            newDB[domain] = ensureQuestionHints(generateStaticAssessment(domain, countPerDomain), domain);
        }
     }));
     
     return newDB;
  };

  // Initialize Assessment (Load or Generate)
  useEffect(() => {
    const savedState = loadAssessmentState(STORAGE_KEY);
    
    if (savedState && savedState.questionsDB && Object.keys(savedState.questionsDB).length > 0) {
        setQuestionsDB(savedState.questionsDB);
        setAnswers(savedState.answers || {});
        setTimeLeft(savedState.timeLeft || config.timeLimit);
        setStep(savedState.step || "intro");
        setActiveSection(savedState.activeSection || "quant");
    } 
    // We don't auto-generate on mount anymore, we wait for user to start or just let startTest handle it
  }, [companyId, STORAGE_KEY]);


  // Persistence Effect
  useEffect(() => {
      if (step === 'test' || step === 'result') {
        saveAssessmentState(STORAGE_KEY, {
            questionsDB,
            answers,
            timeLeft,
            step,
            activeSection
        });
      }
  }, [questionsDB, answers, timeLeft, step, activeSection, STORAGE_KEY]);


  useEffect(() => {
    let timer;
    if (step === "test" && timeLeft > 0) {
      timer = setInterval(() => setTimeLeft((prev) => prev - 1), 1000);
    } else if (timeLeft === 0 && step === "test") {
      submitTest();
    }
    return () => clearInterval(timer);
  }, [step, timeLeft]);

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
  };

  const startTest = async () => {
    setAgentMessage(`Teacher Agent: Configuring ${config.name} environment...`);
    
    // Ensure questions are ready
    if (Object.keys(questionsDB).length === 0) {
        const newDB = await fetchQuestions();
        setQuestionsDB(newDB);
    }

    setAgentMessage("✅ AI Simulation Generated Successfully");
    setTimeout(() => {
      setStep("test");
      setAgentMessage("");
    }, 1000);
  };

  const handleAnswer = (section, id, option) => {
    setAnswers({
      ...answers,
      [section]: { ...answers[section], [id]: option }
    });
  };

  const submitTest = () => {
    setStep("processing");
    runAgentSimulation();
  };

  const runAgentSimulation = () => {
    const sequence = [
      { msg: "Evaluator Agent: Calculating domain accuracy...", delay: 1500 },
      { msg: `Evaluator Agent: Applying ${config.name} weighted criteria...`, delay: 3000 },
      { msg: "Knowledge Gap Agent: Identifying conceptual weak points...", delay: 4500 },
      { msg: "Strategy Agent: Computing Recruitment Readiness Index...", delay: 6000 }
    ];

    let accumDelay = 0;
    sequence.forEach(({ msg, delay }) => {
      setTimeout(() => setAgentMessage(msg), accumDelay);
      accumDelay = delay;
    });

    setTimeout(() => {
        calculateResults();
        setStep("result");
        clearAssessmentState(STORAGE_KEY);
    }, accumDelay + 1000);
  };

  const calculateResults = () => {
    let rawScores = {};
    let weightedScore = 0;
    let totalWeight = 0;

    // 1. Calculate Raw Scores per Domain
    Object.keys(questionsDB).forEach(domain => {
        const questions = questionsDB[domain];
        if (!questions) return;
        
        let correct = 0;
        questions.forEach(q => {
            if (answers[domain]?.[q.id] === q.ans) correct++;
        });
        const percent = (correct / questions.length) * 100;
        rawScores[domain] = percent;

        // 2. Apply Weighting from Config
        const weight = config.domains[domain]?.weight || 0;
        if (weight > 0) {
            weightedScore += (percent * weight);
            totalWeight += weight;
        }
    });

    // Normalize weighted score (in case weights don't sum to exactly 1)
    const finalScore = totalWeight > 0 ? weightedScore / totalWeight : 0;
    
    setReadinessScore(finalScore);
    setDomainScores(rawScores);

    // 3. Determine Tier
    let calculatedTier = "Beginner";
    // Advanced: High score AND decent performance in heaviest domain
    const heaviestDomain = Object.entries(config.domains).reduce((a, b) => a[1].weight > b[1].weight ? a : b)[0];
    
    if (finalScore > 85 && rawScores[heaviestDomain] > 70) {
        calculatedTier = "Advanced";
    } else if (finalScore > 65) {
        calculatedTier = "Intermediate";
    }
    
    setTier(calculatedTier);

    // Call Knowledge Gap Agent
    setAgentMessage("Knowledge Gap Agent: Analyzing proficiency...");
    // Using a self-invoking async function to handle the async calls without making calculateResults async
    (async () => {
        try {
            const topic = `${config.name} Simulation`;
            
            // 1. Bulk Gap Analysis
            const analysisData = await TeacherAgent.analyzeGap(questionsDB, answers, topic);
            setAnalysis(analysisData);

            // 2. Specific Diagnosis for Mistakes
            // Flatten questions and answers for diagnosis
            const allQuestions = [];
            Object.values(questionsDB).forEach(arr => allQuestions.push(...arr));
            
            const flatAnswers = {};
             Object.values(answers).forEach(domainAns => {
                 Object.assign(flatAnswers, domainAns);
             });

            const incorrectIndices = allQuestions
                .filter(q => flatAnswers[q.id] && flatAnswers[q.id] !== q.ans)
                .map(q => q.id);
            
            if (incorrectIndices.length > 0) {
                 setAgentMessage("Diagnostic Specialist: deep diving into mistakes...");
                 const diagnoses = [];
                 
                 // Analyze specific mistakes (limit to first 2)
                 for (const qId of incorrectIndices.slice(0, 2)) {
                     const q = allQuestions.find(que => que.id === qId);
                     const userAns = flatAnswers[qId];
    
                     if (q) {
                         const evalResult = await TeacherAgent.evaluateAnswer(q.q, userAns, topic);
                         if (evalResult) {
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
        setAgentMessage("");
    })();
  };

  // Learning Plan Resources
  const learningResources = {
    Beginner: {
        logo: "https://upload.wikimedia.org/wikipedia/commons/4/43/GeeksforGeeks.svg",
        title: "Aptitude Basics",
        description: "Master the fundamentals of quantitative aptitude and logical reasoning.",
        readinessTier: "Beginner",
        simulationType: "Topic-wise Drills",
        link: "https://www.geeksforgeeks.org/aptitude-questions-and-answers/",
        video: "https://www.youtube.com/embed/5_5oE5lGRFc"
    },
    Intermediate: {
        logo: "https://upload.wikimedia.org/wikipedia/commons/1/19/LeetCode_logo_black.png",
        title: "TCS/Infosys Mock",
        description: "Company-specific patterns including pseudo-code and verbal ability.",
        readinessTier: "Intermediate",
        simulationType: "Full-length Mocks",
        link: "https://leetcode.com/discuss/interview-question",
        video: "https://www.youtube.com/embed/SqcY0GlETPk"
    },
    Advanced: {
        logo: "https://upload.wikimedia.org/wikipedia/commons/6/65/HackerRank_logo.png",
        title: "Advanced Simulation",
        description: "High-difficulty scenarios for top-tier service company roles (e.g. TCS Digital).",
        readinessTier: "Advanced",
        simulationType: "High-Package Role Prep",
        link: "https://www.hackerrank.com/dashboard",
        video: "https://www.youtube.com/embed/zHxt7Ta3914"
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-white flex flex-col items-center justify-center p-6 relative overflow-hidden font-sans selection:bg-blue-500/30">
      
      {/* Background Grid with Fade */}
      <div className="absolute inset-0 bg-[url('/grid.svg')] bg-center mask-[linear-gradient(180deg,white,rgba(255,255,255,0))] pointer-events-none opacity-50" />
      
      {/* Agent Status Bar */}
      <AnimatePresence>
        {agentMessage && step !== 'intro' && step !== 'result' && step !== 'learning-plan' && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="fixed top-8 left-1/2 transform -translate-x-1/2 bg-slate-900/90 backdrop-blur-md border border-white/10 px-6 py-3 rounded-full shadow-2xl flex items-center gap-3 z-50"
          >
            <div className={`w-2.5 h-2.5 rounded-full animate-pulse ${step === 'processing' ? 'bg-purple-400 box-shadow-[0_0_10px_#A78BFA]' : 'bg-blue-400 box-shadow-[0_0_10px_#60A5FA]'}`} />
            <span className="text-sm font-semibold text-white tracking-wide font-mono">{agentMessage}</span>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="absolute top-8 left-8 z-50">
         <button
            onClick={() => {
              clearAssessmentState(STORAGE_KEY);
              navigate('/dashboard?mode=exam');
            }}
            className="group flex items-center gap-3 text-slate-500 hover:text-white transition-colors"
         >
           <svg className="w-5 h-5 group-hover:-translate-x-1 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor">
             <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
           </svg>
           <span className="text-xs font-black uppercase tracking-[0.3em]">Exit Simulation</span>
         </button>
      </div>

      <div className="max-w-6xl w-full relative z-10 flex flex-col h-full">
        
        {/* Header - Only show if active test */}
        {step === "test" && (
            <header className="flex justify-between items-center mb-6 px-4">
                <div>
                    <h1 className={`text-2xl font-bold bg-clip-text text-transparent bg-linear-to-r ${config.color}`}>
                        {config.name} Simulation
                    </h1>
                </div>
                <div className={`text-xl font-mono font-bold px-4 py-2 rounded-lg border backdrop-blur-sm ${timeLeft < 120 ? 'border-red-500 text-red-400 bg-red-500/10 animate-pulse' : 'border-white/10 text-slate-300 bg-black/20'}`}>
                    {formatTime(timeLeft)}
                </div>
            </header>
        )}

        {step === "intro" && (
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="w-full max-w-4xl mx-auto mt-12 mb-12"
          >
            <div className="text-center mb-16">
                <span className="inline-block px-3 py-1 rounded-full bg-blue-500/10 text-blue-400 text-xs font-bold uppercase tracking-wider mb-6 border border-blue-500/20">
                  Service Based Prep
                </span>
                <div className="flex items-center gap-4 justify-center mb-6">
                    <div className="w-12 h-12 bg-white rounded-lg p-2 shadow-lg flex items-center justify-center">
                        <img src={config.logo} alt={config.name} className="max-w-full max-h-full object-contain" />
                    </div>
                    <h1 className="text-5xl md:text-6xl font-black text-white tracking-tight capitalize">
                      {config.name} Interview
                    </h1>
                </div>
                <p className="text-slate-400 text-lg max-w-2xl mx-auto leading-relaxed">
                  Synchronizing with {config.name} Interview Model. Validate your understanding with our simulated assessment.
                </p>
            </div>
            
            <div className="grid md:grid-cols-3 gap-8 mb-16 text-left">
                 <div className="p-8 rounded-2xl border border-slate-800 bg-[#0A1120] hover:border-slate-700 transition-colors">
                    <div className="text-slate-500 font-bold mb-4 text-xs uppercase tracking-wider border-b border-slate-800 pb-2">Focus Areas</div>
                    <div className="flex flex-wrap gap-2">
                       {Object.entries(config.domains).map(([key, d]) => d.weight > 0 && (
                          <span key={key} className="px-2 py-1 bg-slate-800 text-slate-300 rounded text-xs font-medium border border-slate-700">{d.label}</span>
                       ))}
                    </div>
                 </div>

                 <div className="p-8 rounded-2xl border border-slate-800 bg-[#0A1120] hover:border-slate-700 transition-colors flex flex-col justify-between">
                     <div className="text-slate-500 font-bold mb-2 text-xs uppercase tracking-wider border-b border-slate-800 pb-2">Time Limit</div>
                     <div className="text-white text-xl font-medium">{config.timeLimit / 60} Minutes</div>
                 </div>

                 <div className="p-8 rounded-2xl border border-slate-800 bg-[#0A1120] hover:border-slate-700 transition-colors flex flex-col justify-between">
                     <div className="text-slate-500 font-bold mb-2 text-xs uppercase tracking-wider border-b border-slate-800 pb-2">Format</div>
                     <div className="text-white text-xl font-medium">Domain Based</div>
                 </div>
            </div>

            {agentMessage && (
                <div className="mb-8 text-center">
                    <span className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-blue-900/20 text-blue-300 text-sm font-mono border border-blue-500/20">
                        <span className="w-2 h-2 rounded-full bg-blue-400 animate-pulse"/>
                        {agentMessage}
                    </span>
                </div>
            )}

            <div className="text-center">
                <button
                  onClick={startTest}
                  className="bg-white text-slate-900 hover:bg-slate-200 px-8 py-4 rounded-xl font-bold text-lg transition-all shadow-lg active:scale-95"
                >
                  Begin Assessment
                </button>
            </div>

            <div className="mt-12">
                <AgentSystemPanel compact />
            </div>
          </motion.div>
        )}

        {step === "test" && (
            <motion.div 
                initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                className="flex flex-col lg:flex-row gap-8 h-[calc(100vh-140px)]"
            >
                {/* Sidebar Navigation */}
                <div className="w-full lg:w-72 flex flex-col gap-4">
                    <div className="flex flex-row lg:flex-col gap-2 overflow-x-auto lg:overflow-visible pb-2 lg:pb-0 scrollbar-hide">
                        {Object.keys(config.domains).map(key => config.domains[key].weight > 0 && (
                            <button
                                key={key}
                                onClick={() => setActiveSection(key)}
                                className={`p-4 rounded-xl text-left font-medium transition-all whitespace-nowrap border flex justify-between items-center group
                                    ${activeSection === key 
                                        ? 'bg-blue-600 text-white border-blue-500 shadow-lg shadow-blue-900/20' 
                                        : 'bg-[#0A1120] border-slate-800 text-slate-400 hover:border-slate-600 hover:text-white'}`}
                            >
                                <span className="text-sm font-bold tracking-wide">{config.domains[key].label}</span>
                                <span className={`text-[10px] font-bold px-2 py-0.5 rounded ${activeSection === key ? 'bg-white/20 text-white' : 'bg-slate-800 text-slate-500'}`}>
                                    {Object.keys(answers[key] || {}).length}/{questionsDB[key].length}
                                </span>
                            </button>
                        ))}
                    </div>
                    
                    <div className="mt-auto hidden lg:block">
                        <button 
                            onClick={submitTest}
                            className="w-full bg-emerald-600 hover:bg-emerald-500 text-white p-4 rounded-xl font-bold transition-all shadow-lg hover:shadow-emerald-500/20 flex items-center justify-center gap-2"
                        >
                            <span>Submit All</span>
                            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
                        </button>
                    </div>
                </div>

                {/* Question Area */}
                <div className="flex-1 bg-[#0A1120] border border-slate-800 rounded-2xl p-8 overflow-y-auto custom-scrollbar relative">
                    <div className="absolute top-0 left-0 w-full h-16 bg-linear-to-b from-[#0A1120] to-transparent pointer-events-none z-10"/>

                    <div className="max-w-3xl mx-auto space-y-12 pb-20 pt-4">
                        <div className="flex items-center justify-between border-b border-slate-800 pb-6">
                             <h3 className="text-2xl font-bold text-white tracking-tight">
                                {config.domains[activeSection]?.label}
                            </h3>
                            <span className="text-xs font-mono text-slate-500 uppercase tracking-widest">
                                Section {Object.keys(config.domains).indexOf(activeSection) + 1}
                            </span>
                        </div>

                        {questionsDB[activeSection].map((q, idx) => (
                            <div key={q.id} className="group">
                                <div className="flex gap-6 mb-6">
                                    <span className="text-slate-500 font-mono text-sm pt-1 shrink-0">0{idx + 1}</span>
                                    <p className="text-lg text-slate-200 leading-relaxed font-normal">
                                        {q.q}
                                    </p>
                                </div>
                                <div className="space-y-3 pl-0 md:pl-10">
                                    <div className="mb-3">
                                        <button
                                            onClick={() => setVisibleHints((prev) => ({ ...prev, [q.id]: !prev[q.id] }))}
                                            className="rounded-full border border-cyan-500/20 bg-cyan-500/10 px-3 py-1.5 text-[10px] font-black uppercase tracking-widest text-cyan-300"
                                        >
                                            {visibleHints[q.id] ? "Hide Hint" : "Show Hint"}
                                        </button>
                                        {visibleHints[q.id] ? (
                                            <div className="mt-3 rounded-2xl border border-cyan-500/10 bg-cyan-950/20 px-4 py-3 text-sm leading-6 text-cyan-100/80">
                                                {q.hint || "Start by isolating the most important constraint before solving."}
                                            </div>
                                        ) : null}
                                    </div>
                                    {q.options.map(opt => (
                                        <button
                                            key={opt}
                                            onClick={() => handleAnswer(activeSection, q.id, opt)}
                                            className={`w-full p-4 rounded-xl text-left border transition-all flex items-center gap-4 group
                                                ${answers[activeSection]?.[q.id] === opt
                                                    ? 'bg-blue-600/10 border-blue-500 text-white'
                                                    : 'bg-transparent border-slate-800 text-slate-400 hover:border-slate-600 hover:text-slate-200'}`}
                                        >
                                            <div className={`w-5 h-5 rounded-full border flex items-center justify-center shrink-0 transition-colors
                                                ${answers[activeSection]?.[q.id] === opt 
                                                    ? 'border-blue-500' 
                                                    : 'border-slate-700 group-hover:border-slate-500'}`}>
                                                {answers[activeSection]?.[q.id] === opt && <div className="w-2.5 h-2.5 rounded-full bg-blue-500"/>}
                                            </div>
                                            <span className="text-base font-medium">{opt}</span>
                                        </button>
                                    ))}
                                </div>
                            </div>
                        ))}
                    </div>

                    <div className="lg:hidden mt-8 pb-8">
                         <button 
                            onClick={submitTest}
                            className="w-full bg-emerald-600 hover:bg-emerald-500 text-white p-4 rounded-xl font-bold transition-all shadow-lg hover:shadow-emerald-500/20"
                        >
                            Submit Assessment
                        </button>
                    </div>
                </div>
            </motion.div>
        )}

        {step === "test" ? <FloatingCalculator /> : null}

        {step === "processing" && (
            <div className="flex flex-col items-center justify-center h-[60vh]">
                <div className="relative w-32 h-32 mb-10">
                    <div className="absolute inset-0 border-4 border-slate-800 rounded-full" />
                    <div className="absolute inset-0 border-4 border-blue-500 rounded-full border-t-transparent animate-spin" />
                    <div className="absolute inset-0 border-4 border-purple-500 rounded-full border-t-transparent animate-spin [animation-duration:1.5s] scale-75 opacity-70" />
                    
                    <div className="absolute inset-0 flex items-center justify-center">
                         <span className="text-4xl animate-pulse">⚙️</span>
                    </div>
                </div>
                <h2 className="text-4xl font-bold mb-4 text-white tracking-tight">Calibrating Performance</h2>
            </div>
        )}

        {step === "result" && (
            <motion.div 
               initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}
               className="w-full max-w-4xl mx-auto mt-8 bg-[#0A1120] border border-slate-800 p-12 rounded-2xl shadow-xl text-center"
            >
                <div className="grid md:grid-cols-2 gap-12 items-center">
                    
                    {/* Left: Score */}
                    <div className="text-left">
                        <div className="uppercase tracking-widest text-xs font-bold text-slate-500 mb-2">Readiness Score</div>
                        <div className="flex items-baseline gap-2 mb-6">
                            <span className={`text-8xl font-black tracking-tighter
                                ${tier === 'Advanced' ? 'text-purple-400' : 
                                  tier === 'Intermediate' ? 'text-blue-400' : 
                                  'text-orange-400'}`}>
                                {Math.round(readinessScore)}
                            </span>
                            <span className="text-4xl font-light text-slate-600">%</span>
                        </div>
                        
                        <div className={`inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-bold border
                             ${tier === 'Advanced' ? 'border-purple-500/20 text-purple-300 bg-purple-500/10' : 
                               tier === 'Intermediate' ? 'border-blue-500/20 text-blue-300 bg-blue-500/10' : 
                               'border-orange-500/20 text-orange-300 bg-orange-500/10'}`}>
                            <span className={`w-2 h-2 rounded-full ${
                                tier === 'Advanced' ? 'bg-purple-400' : 
                                tier === 'Intermediate' ? 'bg-blue-400' : 'bg-orange-400'
                            }`}/>
                            {tier} Proficiency
                        </div>

                        {analysis && (
                            <div className="mt-8">
                                <button
                                    onClick={() => setStep("analysis")} 
                                    className="text-blue-400 hover:text-white text-sm font-bold flex items-center gap-2 group transition-colors"
                                >
                                    View Knowledge Gap Analysis
                                    <svg className="w-4 h-4 group-hover:translate-x-1 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" /></svg>
                                </button>
                            </div>
                        )}
                    </div>

                    {/* Right: Breakdown */}
                    <div className="text-left">
                        <h4 className="text-white font-bold mb-6 text-sm uppercase tracking-wider border-b border-slate-800 pb-2">
                            Domain Breakdown
                        </h4>
                        <div className="space-y-6">
                            {Object.entries(domainScores).map(([key, score]) => config.domains[key].weight > 0 && (
                                <div key={key}>
                                    <div className="flex justify-between text-sm mb-2 font-medium">
                                        <span className="text-slate-300">{config.domains[key].label}</span>
                                        <span className="text-slate-500">{Math.round(score)}%</span>
                                    </div>
                                    <div className="h-1.5 bg-slate-800/50 rounded-full overflow-hidden">
                                        <div 
                                            className={`h-full rounded-full ${score > 75 ? 'bg-emerald-500' : score > 40 ? 'bg-yellow-500' : 'bg-red-500'}`} 
                                            style={{ width: `${score}%` }}
                                        />
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>

                <div className="mt-16 pt-8 border-t border-slate-800 flex gap-4 justify-center">
                     <button 
                        onClick={() => {
                            clearAssessmentState(STORAGE_KEY);
                            navigate("/service-selection");
                        }}
                        className="px-6 py-3 rounded-lg font-bold text-sm text-slate-400 hover:text-white hover:bg-white/5 transition-colors"
                    >
                        Different Company
                    </button>
                    <button 
                        onClick={() => {
                            clearAssessmentState(STORAGE_KEY);
                             // Reset state logic
                             setStep("intro");
                             setQuestionsDB({});
                             setAnswers({});
                             setTimeLeft(config.timeLimit);
                        }}
                        className="px-6 py-3 rounded-lg font-bold text-sm text-slate-400 hover:text-white hover:bg-white/5 transition-colors"
                    >
                        Retake
                    </button>
                    <button
                        onClick={() => setStep("learning-plan")} 
                        className="bg-white text-slate-900 px-8 py-3 rounded-lg font-bold text-sm transition-all hover:bg-slate-200 shadow-lg"
                    >
                        Personalized Plan
                    </button>
                </div>
            </motion.div>
        )}

        {step === "analysis" && analysis && (
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
                             <span className="text-lg bg-white/5 p-1.5 rounded-lg">💡</span>
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
                                    <div>
                                        <span className="text-slate-500 font-bold block mb-1">Missed Concept</span>
                                        <span className="text-purple-300 font-medium">{diag.missing_concept}</span>
                                    </div>
                                </div>
                                <div className="mt-2 flex justify-end">
                                     <span className="px-2 py-0.5 bg-yellow-500/10 text-yellow-500 border border-yellow-500/20 rounded text-[10px] font-bold uppercase tracking-wide">
                                        {diag.prerequisite_needed ? "⚠️ Refresher Needed" : "✅ Concept Clear"}
                                     </span>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}

             <div className="flex justify-end gap-3 pt-4 border-t border-white/5">
                  <button
                    onClick={() => setStep("result")} 
                    className="text-slate-400 hover:text-white text-sm font-medium px-4 py-2 hover:bg-white/5 rounded-lg transition-colors"
                  >
                    Back to Score
                  </button>
                  <button
                    onClick={() => setStep("learning-plan")} 
                    className="bg-white text-slate-900 hover:bg-slate-200 px-5 py-2 rounded-lg font-bold text-sm transition-colors shadow-lg"
                  >
                    View Recommended Strategy →
                  </button>
             </div>
          </motion.div>
        )}

        {step === "learning-plan" && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-slate-900/50 backdrop-blur-sm border border-white/10 p-10 rounded-3xl shadow-2xl text-center max-w-4xl mx-auto"
          >
             <h2 className="text-4xl font-bold mb-4 text-white">Recommended Strategy</h2>
             <p className="text-slate-300 text-lg mb-10">
               Based on your <span className={`font-bold ${
                  tier === 'Advanced' ? 'text-purple-400' : 
                  tier === 'Intermediate' ? 'text-blue-400' : 'text-orange-400'
               }`}>{tier}</span> status, we have curated this specific preparation path.
             </p>

             {(() => {
                const resource = learningResources[tier] || learningResources.Beginner;

                return (
                 <div className="grid md:grid-cols-2 gap-8 items-start">
                   {/* Resource Card */}
                   <div className="bg-white rounded-2xl p-8 flex flex-col items-center justify-between h-full shadow-lg hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-1">
                     <div className="mb-6 h-20 flex items-center justify-center">
                       <img 
                          src={resource.logo} 
                          alt={resource.title} 
                          className="max-h-full max-w-full object-contain"
                       />
                     </div>
                     <h3 className="text-slate-800 text-2xl font-bold mb-3">{resource.title}</h3>
                     
                     <div className="mb-4 w-full bg-slate-100 p-3 rounded-xl border border-slate-200">
                          <div className="flex justify-between text-xs text-slate-500 font-bold uppercase tracking-wide mb-1">
                             <span>Comp. Readiness</span>
                             <span className="text-blue-600">{resource.readinessTier}</span>
                          </div>
                          <div className="flex justify-between text-xs text-slate-500 font-bold uppercase tracking-wide">
                             <span>Simulation Focus</span>
                             <span className="text-emerald-600">{resource.simulationType}</span>
                          </div>
                     </div>

                     <p className="text-slate-600 mb-6 text-sm leading-relaxed">
                       {resource.description}
                     </p>
                     <a 
                       href={resource.link} 
                       target="_blank" 
                       rel="noopener noreferrer"
                       className="w-full block text-white font-bold py-3 rounded-xl transition-colors bg-blue-600 hover:bg-blue-700"
                     >
                       Start Preparation
                     </a>
                   </div>

                   {/* Video Card */}
                   <div className="bg-slate-800 rounded-2xl p-4 h-full border border-slate-700 shadow-lg flex flex-col">
                      <h3 className="text-white text-xl font-bold mb-4 text-left px-2">Expert Breakdown</h3>
                      <div className="relative w-full pt-[56.25%] rounded-xl overflow-hidden bg-black flex-1">
                        <iframe 
                          className="absolute top-0 left-0 w-full h-full"
                          src={resource.video}
                          title="Recommended Tutorial"
                          frameBorder="0" 
                          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" 
                          allowFullScreen
                        ></iframe>
                      </div>
                      <p className="text-slate-500 text-xs mt-4 px-2">
                        *This video is a preview of the recommended learning material.
                      </p>
                   </div>
                 </div>
                );
             })()}

             <div className="mt-12 flex justify-center flex-col items-center gap-4">
                
                {/* Did You Know Stat */}
                <div className="bg-slate-800/50 border border-slate-700/50 px-6 py-4 rounded-xl max-w-2xl mb-6">
                    <p className="text-slate-300 text-sm font-medium italic">
                        "{getRandomFact()}"
                    </p>
                </div>

                <button
                  onClick={() => {
                      clearAssessmentState(STORAGE_KEY);
                      navigate("/dashboard");
                  }}
                  className="bg-slate-800 hover:bg-slate-700 text-white px-8 py-3 rounded-xl font-bold text-lg transition-all border border-slate-600"
                >
                  Return to Dashboard
                </button>
                 <p className="text-xs text-slate-500 max-w-md">
                   *External links will open in a new tab. We recommend following the structured path for best results.
                </p>
             </div>
          </motion.div>
        )}

      </div>
    </div>
  );
};

export default ServiceBasedAssessment;
