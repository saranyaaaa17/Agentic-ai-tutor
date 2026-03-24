import { useState, useEffect, useMemo, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { supabase } from "../lib/supabase";
import { companyConfig } from "../lib/companyConfig";
import BackButton from "../components/ui/BackButton";
import { generateAssessment as generateStaticAssessment, loadAssessmentState, saveAssessmentState, clearAssessmentState } from "../utils/assessmentUtils";
import { getRandomFact } from "../data/learningFacts";
import { TeacherAgent } from "../agents/TeacherAgent";
import AgentSystemPanel from "../components/agents/AgentSystemPanel";
import { ensureQuestionHints } from "../utils/questionEnhancers";

const ProductBasedAssessment = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const companyId = searchParams.get("company");
  
  // Load Config
  const config = useMemo(() => {
    return companyConfig[companyId] || companyConfig.google;
  }, [companyId]);

  const STORAGE_KEY = `assessment_product_${companyId}_${user?.id}_v2`;

  const [step, setStep] = useState("intro"); 
  const [questionsDB, setQuestionsDB] = useState({});
  const [activeSection, setActiveSection] = useState("");
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
  const [isReviewing, setIsReviewing] = useState(false);
  const [isGeneratingPractice, setIsGeneratingPractice] = useState(false);

  // Helper to fetch questions (AI with fallback)
  const fetchQuestions = async () => {
    const newDB = {};
    const totalQuestions = 10;
    
    setAgentMessage("Teacher Agent: Designing company-specific algorithms...");

    const domains = Object.keys(config.domains).filter(d => config.domains[d].weight > 0);

    await Promise.all(domains.map(async (domain) => {
        const weight = config.domains[domain].weight || 0;
        const count = Math.max(1, Math.round(totalQuestions * weight));
        
        try {
             // Enrich topic for AI
             let promptTopic = `${config.name} Interview - ${config.domains[domain].label}`;
             if (domain === 'dsa_hard') promptTopic += " (Dynamic Programming, Graphs, Advanced Trees)";
             if (domain === 'system_design') promptTopic += " (Scalability, Load Balancing, Database Design)";

             const data = await TeacherAgent.generateAssessment(promptTopic, "advanced", [], {}, count);
             
             if (data.questions && data.questions.length > 0) {
                  newDB[domain] = ensureQuestionHints(data.questions.slice(0, count), promptTopic);
              } else {
                  throw new Error("No questions from agent");
              }
         } catch (err) {
             console.warn(`Agent failed for ${domain}, using static fallback.`);
             newDB[domain] = ensureQuestionHints(generateStaticAssessment(domain, count), domain);
         }
     }));
    
    return newDB;
  };

  // Initialize Assessment (Load or Generate)
  useEffect(() => {
    // Only initialize if we are starting or resuming
    const savedState = loadAssessmentState(STORAGE_KEY);
    
    if (savedState && savedState.questionsDB && Object.keys(savedState.questionsDB).length > 0) {
        // Restore session
        setQuestionsDB(savedState.questionsDB);
        setAnswers(savedState.answers || {});
        setTimeLeft(savedState.timeLeft || config.timeLimit);
        setStep(savedState.step || "intro");
        setActiveSection(savedState.activeSection || Object.keys(config.domains).find(k => config.domains[k].weight > 0) || "dsa_hard");
    } 
    // Wait for explicit start
  }, [config, STORAGE_KEY]); 

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
    setAgentMessage(`Teacher Agent: Provisioning ${config.name} sandbox...`);
    // If questions were not generated correctly, regenerate
    if (Object.keys(questionsDB).length === 0) {
         const newDB = await fetchQuestions();
         setQuestionsDB(newDB);
         // Set initial active section
         const firstDomain = Object.keys(newDB)[0];
         if (firstDomain) setActiveSection(firstDomain);
    }

    setAgentMessage("✅ AI Sandbox Provisioned Successfully");
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

  const submitTest = async () => {
    setStep("processing");
    setAgentMessage("AI Agents Reviewing Performance...");
    setIsReviewing(true);

    // 1. Local Calculation first
    const { finalScore, calculatedTier, rawScores } = calculateResults(true); // Return results instead of just setting state if needed, or rely on state updates (but state is async)
    
    // We need the values immediately for the API call, so calculateResults needs to return them or we recalculate here.
    // Let's modify calculateResults to return values.
    
    try {
        // Flatten answers for analysis
        const flatAnswers = {};
        Object.values(answers).forEach(domainAns => {
            Object.assign(flatAnswers, domainAns);
        });

        // Flatten questions
        const allQuestions = [];
        Object.values(questionsDB).forEach(arr => allQuestions.push(...arr));

        const topic = config.name + " Interview Simulation";

        // 1. Bulk Gap Analysis
        console.log("Calling Gap Analysis...");
        const analysisData = await TeacherAgent.analyzeGap(allQuestions, flatAnswers, topic);
        setAnalysis(analysisData);
        
        // 2. Specific Diagnosis for Mistakes
        const incorrectIndices = allQuestions
            .filter(q => flatAnswers[q.id] && flatAnswers[q.id] !== q.ans)
            .map(q => q.id);
        
        if (incorrectIndices.length > 0) {
             setAgentMessage("Diagnostic Specialist: deep diving into critical errors...");
             const diagnoses = [];
             
             // Analyze critical mistakes (limit to 2 biggest)
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

    } catch (error) {
        console.error("AI Review Failed:", error);
        setAgentMessage("AI Review unavailable. Showing local results.");
    } finally {
        setIsReviewing(false);
        setStep("result");
        clearAssessmentState(STORAGE_KEY);
    }
  };

  const generateAdaptivePractice = async () => {
    if (!analysis || (!analysis.weak_concepts && !analysis.recommended_focus)) {
        // Fallback to retake if no AI data
        clearAssessmentState(STORAGE_KEY);
        setStep("intro");
        setQuestionsDB({});
        setAnswers({});
        setTimeLeft(config.timeLimit);
        return;
    }

    setIsGeneratingPractice(true);
    setAgentMessage("Instructional Designer Agent: Crafting personalized questions...");

    const weakConcepts = analysis.weak_concepts?.length > 0 
        ? analysis.weak_concepts 
        : ["General DSA"];

    try {
        const { data: { session } } = await supabase.auth.getSession();
        const token = session?.access_token;

        const response = await fetch('/api/generate-adaptive-practice', {
            method: 'POST',
            headers: { 
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({
                weakConcepts,
                topic: config.name,
                studentLevel: tier, // Use the calculated tier
                targetDifficulty: readinessScore > 70 ? "hard" : "medium" // Adapt difficulty
            })
        });

        if (!response.ok) throw new Error("Generation failed");

        const data = await response.json();
        
        // Transform generated questions to match our internal format
        const newQuestions = data.generatedQuestions.map((q, i) => ({
            id: `adaptive_${Date.now()}_${i}`,
            q: q.questionText,
            options: q.options,
            ans: q.correctAnswer,
            explanation: q.explanation // We can show this in result or after answer
        }));
        
        // Reset state for new practice session
        clearAssessmentState(STORAGE_KEY);
        setQuestionsDB({ "adaptive_practice": newQuestions });
        setActiveSection("adaptive_practice");
        setAnswers({});
        setTimeLeft(600); // 10 mins for practice
        setStep("test");
        setStep("test");
        // setAiReview(prev => ({ ...prev, workflow: data.workflow })); // Optional: update workflow to show generation trace

    } catch (error) {
        console.error("Adaptive Gen Failed:", error);
        setAgentMessage("Adaptive generation unavailable. Starting standard retake.");
        setTimeout(() => {
             clearAssessmentState(STORAGE_KEY);
             setStep("intro");
             setQuestionsDB({});
             setAnswers({});
             setTimeLeft(config.timeLimit);
        }, 1500);
    } finally {
        setIsGeneratingPractice(false);
        setAgentMessage("");
    }
  };

  const calculateResults = (returnData = false) => {
    let rawScores = {};
    let weightedScore = 0;
    let totalWeight = 0;

    Object.keys(questionsDB).forEach(domain => {
        const questions = questionsDB[domain] || [];
        if (questions.length === 0) return;

        let correct = 0;
        questions.forEach(q => {
             // Access nested answers correctly
             const domainAns = answers[domain] || {};
             if (domainAns[q.id] === q.ans) correct++;
        });
        const percent = (correct / questions.length) * 100;
        rawScores[domain] = percent;

        const weight = config.domains[domain]?.weight || 0;
        if (weight > 0) {
            weightedScore += (percent * weight);
            totalWeight += weight;
        }
    });

    const finalScore = totalWeight > 0 ? weightedScore / totalWeight : 0;
    setReadinessScore(finalScore);
    setDomainScores(rawScores);

    let calculatedTier = "Beginner";
    if (finalScore > 85) calculatedTier = "Advanced";
    else if (finalScore > 65) calculatedTier = "Intermediate";
    
    setTier(calculatedTier);

    if (returnData) return { finalScore, calculatedTier, rawScores };
  };

  // Removed runAgentSimulation as it's replaced by real API call

  // Learning Resources logic for Product
  const getRefinedResource = () => {
      // Logic: Advanced/Intermediate -> Staff Path. Else -> Senior Refresher.
      if (tier === 'Advanced' || tier === 'Intermediate') {
          return {
              logo: "https://upload.wikimedia.org/wikipedia/commons/thumb/e/e9/Notion-logo.svg/1024px-Notion-logo.svg.png", // Using generic tech logo or System Design related
              title: "Staff Engineer Selection",
              description: "Focus on System Design scalability, trade-offs, and leadership principles (Amazon LPs).",
              readinessTier: "L5/L6 Ready",
              simulationType: "System Design Deep Dive",
              link: "https://bytebytego.com/",
              video: "https://www.youtube.com/embed/SLLnJ1eb5QU"
          };
      } else {
           return {
              logo: "https://upload.wikimedia.org/wikipedia/commons/1/19/LeetCode_logo_black.png",
              title: "Senior Engineer Refresher",
              description: "Strengthen Core DSA patterns and problem-solving speed for optimal coding rounds.",
              readinessTier: "L3/L4 Target",
              simulationType: "Blind 75 / NeetCode 150",
              link: "https://neetcode.io/",
              video: "https://www.youtube.com/embed/5_5oE5lGRFc"
           };
      }
  };


  return (
    <div className="min-h-screen bg-slate-950 text-white flex flex-col items-center justify-center p-6 relative overflow-hidden font-sans selection:bg-yellow-500/30">
      
      {/* Background decoration */}
      <div className={`absolute top-0 left-0 w-full h-[500px] blur-[120px] -z-10 bg-linear-to-b ${config.color} opacity-10 pointer-events-none`} />
      
      {/* Exit Navigation */}
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
           <span className="text-xs font-black uppercase tracking-[0.3em]">Exit Interview</span>
         </button>
      </div>

       {/* Agent Status Bar */}
      <AnimatePresence>
        {agentMessage && step !== 'intro' && step !== 'result' && step !== 'learning-plan' && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="fixed top-8 left-1/2 transform -translate-x-1/2 bg-slate-900/90 backdrop-blur-md border border-white/10 px-6 py-3 rounded-full shadow-2xl flex items-center gap-3 z-50"
          >
            <div className={`w-2.5 h-2.5 rounded-full animate-pulse ${step === 'processing' || isGeneratingPractice ? 'bg-orange-400 box-shadow-[0_0_10px_#FB923C]' : 'bg-yellow-400 box-shadow-[0_0_10px_#FACC15]'}`} />
            <span className="text-sm font-semibold text-white tracking-wide font-mono">{agentMessage}</span>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="max-w-6xl w-full relative z-10 flex flex-col h-full">

        {/* Header */}
        {step === "test" && (
            <header className="flex justify-between items-center mb-6 px-4">
                <div>
                    <h1 className="text-2xl font-bold flex items-center gap-3">
                         <span className={`w-3 h-3 rounded-full bg-linear-to-r ${config.color}`} />
                         {config.name} Simulation
                    </h1>
                </div>
                <div className={`text-xl font-mono font-bold px-4 py-2 rounded-lg border backdrop-blur-sm bg-slate-900/50 ${timeLeft < 300 ? 'border-red-500 text-red-500 animate-pulse' : 'border-slate-700 text-slate-300'}`}>
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
                  Product Based Prep
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
                       {Object.entries(config.domains).map(([key, d]) => d.weight > 0.25 && (
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
                <div className="mb-8 text-yellow-300 font-mono animate-pulse bg-yellow-900/20 py-2 rounded-lg border border-yellow-500/20">{agentMessage}</div>
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
                className="flex flex-col md:flex-row gap-6 h-[70vh]"
            >
                {/* Sidebar Navigation */}
                <div className="w-full md:w-64 flex flex-row md:flex-col gap-2 overflow-x-auto md:overflow-visible pr-2">
                    {Object.keys(config.domains).map(key => config.domains[key].weight > 0 && (
                        <button
                            key={key}
                            onClick={() => setActiveSection(key)}
                            className={`p-4 rounded-xl text-left font-medium transition-all whitespace-nowrap border flex justify-between items-center group
                                ${activeSection === key 
                                    ? 'bg-white/10 border-white/20 text-white shadow-lg backdrop-blur-md' 
                                    : 'bg-transparent border-transparent text-slate-500 hover:text-slate-300 hover:bg-white/5'}`}
                        >
                            <div className="flex flex-col">
                                <span className="text-xs uppercase tracking-wider opacity-60 mb-0.5">{key.replace('_', ' ')}</span>
                                <span className="font-bold text-sm">{config.domains[key].label.split(' ')[0]}</span>
                            </div>
                            {questionsDB[key] && (
                                <span className={`text-xs px-2 py-0.5 rounded-md ${activeSection === key ? 'bg-white text-black' : 'bg-white/5 text-slate-400'}`}>
                                    {Object.keys(answers[key] || {}).length}/{questionsDB[key].length}
                                </span>
                            )}
                        </button>
                    ))}
                    <button 
                        onClick={submitTest}
                        className="mt-auto bg-slate-100 text-slate-900 p-4 rounded-xl font-bold hover:bg-white transition-all shadow-lg hover:shadow-white/10"
                    >
                        Submit Solution
                    </button>
                </div>

                {/* Question Area */}
                <div className="flex-1 bg-[#0A1120] border border-slate-800 rounded-2xl p-8 shadow-xl overflow-y-auto custom-scrollbar relative">
                    <h3 className="text-2xl font-bold mb-8 text-white border-b border-slate-800 pb-4 flex items-center justify-between sticky top-0 bg-[#0A1120]/90 backdrop-blur-md z-20 py-4 mt-0">
                        <span>{config.domains[activeSection]?.label}</span>
                        <span className="text-xs bg-yellow-500/10 text-yellow-500 px-3 py-1 rounded-full border border-yellow-500/20 uppercase tracking-wider font-bold">Hard</span>
                    </h3>
                    
                    <div className="space-y-10">
                        {questionsDB[activeSection]?.map((q, idx) => (
                            <div key={q.id} className="group">
                                <p className="text-xl mb-6 text-slate-200 leading-relaxed font-light">
                                    <span className="text-slate-500 mr-4 font-mono text-sm opacity-50">0{idx + 1}</span>
                                    {q.q}
                                </p>
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
                                                {q.hint || "Eliminate one weak assumption first, then compare the strongest remaining choices."}
                                            </div>
                                        ) : null}
                                    </div>
                                    {q.options.map(opt => (
                                        <button
                                            key={opt}
                                            onClick={() => handleAnswer(activeSection, q.id, opt)}
                                            className={`w-full p-4 rounded-xl text-left border transition-all flex items-center group
                                                ${answers[activeSection]?.[q.id] === opt
                                                    ? 'bg-blue-600/10 border-blue-500 text-white'
                                                    : 'bg-transparent border-slate-800 text-slate-400 hover:border-slate-600 hover:text-slate-200'}`}
                                        >
                                            <div className={`w-5 h-5 rounded-full border mr-4 flex items-center justify-center shrink-0 transition-colors
                                                ${answers[activeSection]?.[q.id] === opt ? 'border-blue-500' : 'border-slate-700 group-hover:border-slate-500'}`}>
                                                {answers[activeSection]?.[q.id] === opt && <div className="w-2.5 h-2.5 rounded-full bg-blue-500" />}
                                            </div>
                                            <span className="text-base font-medium">{opt}</span>
                                        </button>
                                    ))}
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </motion.div>
        )}

        {step === "analysis" && analysis && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-[#0A1120] border border-slate-800 p-8 md:p-12 rounded-[2.5rem] shadow-2xl text-left max-w-6xl mx-auto relative overflow-hidden"
          >
             {/* Header */}
             <div className="flex flex-col md:flex-row items-start md:items-center gap-6 mb-12 border-b border-slate-800 pb-8">
                <div className="p-4 bg-purple-500/10 rounded-2xl border border-purple-500/20 shadow-lg shadow-purple-900/20">
                    <svg className="w-10 h-10 text-purple-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                    </svg>
                </div>
                <div>
                    <h2 className="text-4xl font-bold text-white mb-2 tracking-tight">Knowledge Gap Analysis</h2>
                    <p className="text-slate-400 text-lg">AI-powered insights into your product engineering aptitude.</p>
                </div>
                <div className="md:ml-auto mt-4 md:mt-0">
                     <span className={`px-6 py-3 rounded-xl text-sm font-bold tracking-wide border uppercase
                        ${analysis.proficiency_level === 'Advanced' ? 'bg-purple-500/10 text-purple-300 border-purple-500/20' : 
                          analysis.proficiency_level === 'Intermediate' ? 'bg-yellow-500/10 text-yellow-300 border-yellow-500/20' : 
                          'bg-green-500/10 text-green-300 border-green-500/20'
                        }`}>
                        {analysis.proficiency_level} Proficiency
                     </span>
                </div>
             </div>

             <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-12">
                
                {/* Visual Overview Column */}
                <div className="lg:col-span-1 space-y-6">
                    <div className="bg-slate-900/60 p-6 rounded-3xl border border-slate-800 h-full flex flex-col">
                        <h3 className="text-slate-300 font-bold mb-6 flex items-center gap-3 text-lg">
                            <span className="w-1.5 h-6 bg-green-500 rounded-full"/>
                            Core Strengths
                        </h3>
                        <div className="flex flex-wrap gap-2 content-start">
                            {analysis.strong_concepts?.map((c, i) => (
                                <span key={i} className="px-4 py-2 bg-green-500/5 text-green-400 rounded-lg text-sm font-medium border border-green-500/10">
                                    {c}
                                </span>
                            )) || <span className="text-slate-500 text-sm italic">Analysis in progress...</span>}
                        </div>

                        <div className="w-full h-px bg-slate-800 my-8"/>

                        <h3 className="text-slate-300 font-bold mb-6 flex items-center gap-3 text-lg">
                            <span className="w-1.5 h-6 bg-red-500 rounded-full"/>
                            Growth Areas
                        </h3>
                        <div className="flex flex-wrap gap-2 content-start">
                             {analysis.weak_concepts?.map((c, i) => (
                                <span key={i} className="px-4 py-2 bg-red-500/5 text-red-400 rounded-lg text-sm font-medium border border-red-500/10">
                                    {c}
                                </span>
                            )) || <span className="text-slate-500 text-sm italic">Ideally none!</span>}
                        </div>
                    </div>
                </div>

                {/* Detailed Analysis Column */}
                <div className="lg:col-span-2 flex flex-col gap-6">
                    <div className="bg-slate-900/60 p-8 rounded-3xl border border-slate-800 relative group transition-all hover:border-purple-500/20">
                        <div className="absolute top-0 right-0 p-8 opacity-20 group-hover:opacity-40 transition-opacity">
                            <svg className="w-24 h-24 text-purple-500" fill="currentColor" viewBox="0 0 24 24"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-6h2v6zm0-8h-2V7h2v2z"/></svg>
                        </div>
                        <h3 className="text-2xl font-bold text-white mb-6">Evaluation Summary</h3>
                        <p className="text-slate-300 text-lg leading-loose font-light relative z-10">
                            {analysis.gap_analysis}
                        </p>
                    </div>

                    <div className="bg-linear-to-r from-purple-900/20 to-blue-900/20 p-8 rounded-3xl border border-purple-500/20 flex items-center gap-6">
                        <div className="bg-purple-500/20 p-4 rounded-full">
                            <svg className="w-8 h-8 text-purple-300" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>
                        </div>
                        <div>
                            <span className="block text-xs font-bold text-purple-400 uppercase tracking-widest mb-1">Recommended Focus</span>
                            <span className="text-xl text-white font-medium">"{analysis.recommended_focus}"</span>
                        </div>
                    </div>
                </div>
             </div>

             {/* Deep Dive Diagnosis Section */}
             {diagnosisResults && diagnosisResults.length > 0 && (
                <div className="mt-12 pt-12 border-t border-slate-800">
                    <div className="flex items-center gap-4 mb-10">
                         <div className="p-3 bg-red-500/10 rounded-xl border border-red-500/20">
                             <svg className="w-6 h-6 text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19.428 15.428a2 2 0 00-1.022-.547l-2.384-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" />
                             </svg>
                         </div>
                        <h3 className="text-3xl font-bold text-white">Mistake Deep Dive</h3>
                    </div>
                    
                    <div className="grid gap-6">
                        {diagnosisResults.map((diag, i) => (
                            <div key={i} className="bg-slate-900 border border-slate-800 p-8 rounded-3xl hover:border-slate-700 transition-colors group">
                                <div className="flex flex-col md:flex-row gap-8">
                                    <div className="flex-1">
                                        <div className="flex items-center gap-3 mb-4">
                                            <span className="bg-red-500/10 text-red-400 text-xs font-bold px-3 py-1 rounded-full uppercase tracking-wider border border-red-500/20">Mistake #{i+1} analysis</span>
                                            <span className="text-slate-500 text-sm font-mono">Your Answer: <span className="text-slate-300 border-b border-red-500/30">{diag.userAnswer}</span></span>
                                        </div>
                                        <p className="text-xl text-white font-medium mb-6 leading-snug">"{diag.question}"</p>
                                        
                                        <div className="grid sm:grid-cols-2 gap-4">
                                            <div className="bg-black/30 p-5 rounded-2xl border border-white/5">
                                                <span className="text-slate-500 text-xs font-bold uppercase tracking-wider block mb-2">Root Cause</span>
                                                <p className="text-slate-300 text-sm leading-relaxed">{diag.root_cause}</p>
                                            </div>
                                             <div className="bg-black/30 p-5 rounded-2xl border border-white/5">
                                                <span className="text-slate-500 text-xs font-bold uppercase tracking-wider block mb-2">Refresher Topic</span>
                                                <p className="text-blue-400 text-sm font-mono cursor-pointer hover:underline">{diag.recommended_review_topic}</p>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="w-full md:w-64 shrink-0 flex flex-col gap-3">
                                        <div className="flex-1 bg-slate-800/40 p-5 rounded-2xl border border-white/5 flex flex-col justify-center text-center">
                                            <span className="text-slate-500 text-xs font-bold uppercase tracking-wider mb-1">Missing Concept</span>
                                            <span className="text-purple-300 font-bold">{diag.missing_concept}</span>
                                        </div>
                                        <div className={`p-5 rounded-2xl border flex flex-col justify-center text-center transition-colors
                                            ${diag.prerequisite_needed ? 'bg-yellow-500/10 border-yellow-500/20' : 'bg-green-500/10 border-green-500/20'}`}>
                                            <span className={`text-xs font-bold uppercase tracking-wider mb-1 ${diag.prerequisite_needed ? 'text-yellow-500' : 'text-green-500'}`}>
                                                Prerequisite Check
                                            </span>
                                            <span className={`font-bold ${diag.prerequisite_needed ? 'text-yellow-200' : 'text-green-200'}`}>
                                                {diag.prerequisite_needed ? "⚠️ Review Needed" : "✅ All Clear"}
                                            </span>
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
                    onClick={() => setStep("result")} 
                    className="text-slate-400 px-8 py-4 rounded-xl font-bold text-lg transition-all hover:text-white hover:bg-white/5 border border-transparent hover:border-white/10"
                  >
                    Back to Score
                  </button>
             </div>
          </motion.div>
        )}
        
        {step === "processing" && (
            <div className="flex flex-col items-center justify-center h-[60vh]">
                 <div className="w-32 h-32 mb-10 relative">
                    <div className="absolute inset-0 bg-yellow-500/20 blur-3xl rounded-full" />
                    <motion.span 
                        className="absolute inset-0 border-t-4 border-r-4 border-yellow-500 rounded-full"
                        animate={{ rotate: 360 }}
                        transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                    />
                     <motion.span 
                        className="absolute inset-4 border-b-4 border-l-4 border-orange-500 rounded-full"
                        animate={{ rotate: -360 }}
                        transition={{ duration: 1.5, repeat: Infinity, ease: "linear" }}
                    />
                 </div>
                <h3 className="text-4xl font-bold text-white mb-4 tracking-tight">Calibrating Results</h3>
                <p className="text-slate-400 font-mono text-lg">{agentMessage}</p>
            </div>
        )}

        {step === "result" && (
            <motion.div 
               initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }}
               className="max-w-4xl mx-auto"
            >
                <div className="bg-slate-900 border border-slate-700 rounded-[2.5rem] overflow-hidden shadow-2xl relative">
                    {/* Background Glow */}
                    <div className={`absolute -top-20 right-0 w-96 h-96 blur-[150px] rounded-full opacity-20 pointer-events-none 
                        ${tier === 'Advanced' ? 'bg-green-500' : 'bg-red-500'}`} 
                    />

                    <div className="p-8 grid md:grid-cols-3 gap-6 text-center border-b border-white/5 bg-linear-to-b from-slate-800/50 to-slate-900/50 backdrop-blur-xl">
                        <div className="bg-white/5 p-6 rounded-2xl border border-white/5">
                            <span className="text-slate-500 text-[10px] font-bold uppercase tracking-[0.2em] block mb-2">Technical Score</span>
                            <span className="text-4xl font-black text-white">{Math.round(readinessScore)}%</span>
                            <div className="h-1 w-full bg-slate-800 rounded-full mt-3 overflow-hidden">
                                <div className={`h-full ${readinessScore > 70 ? 'bg-green-500' : 'bg-orange-500'}`} style={{ width: `${Math.round(readinessScore)}%` }} />
                            </div>
                        </div>

                        <div className="bg-white/5 p-6 rounded-2xl border border-white/5">
                            <span className="text-slate-500 text-[10px] font-bold uppercase tracking-[0.2em] block mb-2">Behavioral Quality</span>
                            <span className="text-4xl font-black text-blue-400">8.4</span>
                            <div className="flex justify-center gap-1 mt-3">
                                {[1,2,3,4,5].map(i => <div key={i} className={`w-3 h-1 rounded-full ${i <= 4 ? 'bg-blue-400' : 'bg-slate-800'}`} />)}
                            </div>
                        </div>

                        <div className="bg-white/5 p-6 rounded-2xl border border-white/5">
                            <span className="text-slate-500 text-[10px] font-bold uppercase tracking-[0.2em] block mb-2">Readiness Rating</span>
                            <span className={`text-xl font-bold block mt-1 ${tier === 'Advanced' ? 'text-green-400' : 'text-orange-400'}`}>{tier}</span>
                            <div className="mt-4 flex items-center justify-center gap-1">
                                <span className="text-[9px] text-slate-500 uppercase tracking-widest font-black">Fit for {config.name}</span>
                            </div>
                        </div>
                    </div>

                    <div className="p-10 grid md:grid-cols-2 gap-12 bg-slate-950/30">
                        <div>
                            <h4 className="text-white font-bold mb-6 flex items-center gap-3 text-lg">
                                <div className="p-2 rounded-lg bg-yellow-500/10 text-yellow-500">
                                   <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                                   </svg>
                                </div>
                                Technical Breakdown
                            </h4>
                            <div className="space-y-6">
                                {Object.entries(domainScores).map(([key, score]) => config.domains[key].weight > 0 && (
                                    <div key={key}>
                                        <div className="flex justify-between text-sm mb-2 text-slate-400 font-medium">
                                            <span>{config.domains[key].label}</span>
                                            <span className={score > 80 ? 'text-green-400' : 'text-orange-400'}>{Math.round(score)}%</span>
                                        </div>
                                        <div className="h-2 bg-slate-800 rounded-full overflow-hidden">
                                            <div 
                                                className={`h-full rounded-full ${score > 80 ? 'bg-green-500' : 'bg-orange-500'}`} 
                                                style={{ width: `${score}%` }}
                                            />
                                        </div>
                                    </div>
                                ))}
                            </div>
                            </div>

                        <div className="flex flex-col justify-between">
                            <div>
                                <h4 className="text-white font-bold mb-6 flex items-center gap-3 text-lg">
                                    <div className="p-2 rounded-lg bg-purple-500/10 text-purple-500">
                                       <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                                       </svg>
                                    </div>
                                    AI Insights
                                </h4>
                                
                                {analysis ? (
                                    <div className="bg-white/5 border border-white/10 rounded-2xl p-6">
                                        <p className="text-slate-300 text-sm mb-4 line-clamp-3">{analysis.gap_analysis}</p>
                                        <button 
                                            onClick={() => setStep('analysis')}
                                            className="w-full py-3 rounded-xl bg-purple-600/20 text-purple-300 border border-purple-500/30 font-bold hover:bg-purple-600/30 transition-all flex items-center justify-center gap-2"
                                        >
                                            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" /></svg>
                                            View Deep Dive Analysis
                                        </button>
                                    </div>
                                ) : (
                                     <div className="p-6 rounded-2xl bg-slate-800/50 border border-white/5 text-sm text-slate-500">
                                        AI Analysis unavailable.
                                    </div>
                                )}
                            </div>
                            
                            <div className="mt-8 space-y-3">
                                <button 
                                    onClick={() => setStep('learning-plan')}
                                    className="w-full py-4 rounded-xl bg-white text-black font-bold hover:bg-slate-200 transition-colors shadow-lg shadow-white/5"
                                >
                                    View Personalized Learning Plan
                                </button>
                                <div className="flex gap-2">
                                    {analysis && (
                                        <button 
                                            onClick={generateAdaptivePractice}
                                            disabled={isGeneratingPractice}
                                            className="w-full py-4 rounded-xl bg-linear-to-r from-blue-600 to-cyan-500 text-white font-bold hover:shadow-lg hover:shadow-blue-500/20 transition-all flex items-center justify-center gap-2"
                                        >
                                            {isGeneratingPractice ? (
                                                <>
                                                    <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                                    </svg>
                                                    Generating Questions...
                                                </>
                                            ) : (
                                                "Start Personalized Practice"
                                            )}
                                        </button>
                                    )}
                                </div>
                                <div className="flex gap-2 mt-2">
                                    <button 
                                        onClick={() => {
                                            clearAssessmentState(STORAGE_KEY);
                                            // Reset state logic
                                            setStep("intro");
                                            setQuestionsDB({});
                                            setAnswers({});
                                            setTimeLeft(config.timeLimit);
                                            // Trigger reload/regen
                                        }}
                                        className="flex-1 py-4 rounded-xl border border-white/10 text-white hover:bg-white/5 transition-all font-bold"
                                    >
                                        Retake Interview
                                    </button>
                                    <button 
                                        onClick={() => {
                                            clearAssessmentState(STORAGE_KEY);
                                            navigate('/product-selection');
                                        }}
                                        className="flex-1 py-4 rounded-xl border border-white/10 text-slate-400 hover:text-white hover:border-white/30 transition-all font-medium hover:bg-white/5"
                                    >
                                        Other Company
                                    </button>
                                </div>
                            </div>
                            <p className="text-xs text-slate-600 mt-6 leading-relaxed text-center">
                                *Disclaimer: AI-generated evaluation for educational purposes. 
                                Results are indicative of current readiness.
                            </p>
                        </div>
                    </div>
                </div>

                {/* Workflow Debug Panel */}
                {analysis && analysis.workflow && (
                    <div className="mt-8 max-w-4xl mx-auto">
                        <details className="bg-black/40 border border-white/5 rounded-xl overflow-hidden group">
                           <summary className="px-6 py-3 text-xs font-mono text-slate-500 cursor-pointer uppercase tracking-widest hover:bg-white/5 flex justify-between items-center">
                               <span>⚡ Agent Workflow Trace</span>
                               <span className="text-blue-500">{analysis.workflow.totalProcessingTimeMs}ms</span>
                           </summary>
                           <div className="p-6 border-t border-white/5 space-y-3">
                                {analysis.workflow.steps.map((step, i) => (
                                    <div key={i} className="flex items-center justify-between text-xs text-slate-400 font-mono">
                                        <span className="flex items-center gap-2">
                                            <span className="w-2 h-2 rounded-full bg-green-500"></span>
                                            {step.agent}
                                        </span>
                                        <span>{new Date(step.timestamp).toLocaleTimeString()}</span>
                                    </div>
                                ))}
                                <div className="mt-4 pt-4 border-t border-white/5 text-xs text-slate-600">
                                    Model: {analysis.workflow.modelUsed}
                                </div>
                           </div>
                        </details>
                    </div>
                )}
            </motion.div>
        )}

        {step === "learning-plan" && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-slate-900/50 backdrop-blur-sm border border-white/10 p-10 rounded-3xl shadow-2xl text-center max-w-4xl mx-auto"
          >
             <h2 className="text-4xl font-bold mb-4 text-white">Targeted Prep Strategy</h2>
             <p className="text-slate-300 text-lg mb-10 max-w-2xl mx-auto">
               Based on your <span className={`font-bold ${
                  tier === 'Advanced' ? 'text-green-400' : 'text-orange-400'
               }`}>{tier}</span> outcome, we recommend this high-impact resource to bridge the gap.
             </p>

             {(() => {
                const resource = getRefinedResource();

                return (
                 <div className="grid md:grid-cols-2 gap-8 items-start text-left">
                   {/* Resource Card */}
                   <div className="bg-white rounded-3xl p-8 flex flex-col justify-between h-full shadow-xl hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-1 relative overflow-hidden group">
                     {/* Decoration */}
                     <div className="absolute top-0 right-0 w-32 h-32 bg-linear-to-bl from-slate-100 to-transparent rounded-bl-full z-0 opacity-50 transition-opacity group-hover:opacity-100"/>
                     
                     <div className="relative z-10">
                         <div className="mb-8 h-16 flex items-start">
                           <img 
                              src={resource.logo} 
                              alt={resource.title} 
                              className="max-h-full max-w-full object-contain"
                           />
                         </div>
                         <h3 className="text-slate-900 text-3xl font-black mb-4 leading-tight">{resource.title}</h3>
                         
                         <div className="flex gap-2 mb-6 flex-wrap">
                            <span className="px-3 py-1 bg-slate-100 text-slate-600 text-xs font-bold uppercase rounded-lg tracking-wide border border-slate-200">
                                {resource.readinessTier}
                            </span>
                            <span className="px-3 py-1 bg-blue-50 text-blue-600 text-xs font-bold uppercase rounded-lg tracking-wide border border-blue-100">
                                {resource.simulationType}
                            </span>
                         </div>

                         <p className="text-slate-600 mb-8 text-base leading-relaxed">
                           {resource.description}
                         </p>
                     </div>
                     
                     <a 
                       href={resource.link} 
                       target="_blank" 
                       rel="noopener noreferrer"
                       className="relative z-10 w-full flex items-center justify-center gap-2 text-white font-bold py-4 rounded-xl transition-all bg-black hover:bg-slate-800 shadow-lg hover:shadow-xl"
                     >
                       Access Resource <span className="text-lg">↗</span>
                     </a>
                   </div>

                   {/* Video Card */}
                   <div className="bg-slate-950 rounded-3xl p-6 h-full border border-white/10 shadow-lg flex flex-col justify-center relative overflow-hidden">
                      <div className="absolute inset-0 bg-linear-to-b from-transparent to-black/50 pointer-events-none z-10"/>

                      <h3 className="text-white text-xl font-bold mb-6 flex items-center gap-2 relative z-20">
                          <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse"/>
                          Orientation Video
                      </h3>
                      
                      <div className="relative w-full pt-[100%] rounded-2xl overflow-hidden bg-black shadow-2xl border border-white/5 z-20">
                        <iframe 
                          className="absolute top-0 left-0 w-full h-full"
                          src={resource.video}
                          title="Recommended Tutorial"
                          frameBorder="0" 
                          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" 
                          allowFullScreen
                        ></iframe>
                      </div>
                      
                      <p className="text-slate-500 text-xs mt-6 text-center z-20">
                          Watch this brief overview to understand the curriculum structure.
                      </p>
                   </div>
                 </div>
                );
             })()}

             <div className="mt-16 flex justify-center flex-col items-center gap-4">
                
                {/* Did You Know Stat */}
                <div className="bg-purple-500/10 border border-purple-500/20 px-6 py-4 rounded-xl max-w-2xl mb-6">
                    <p className="text-purple-200 text-sm font-medium italic">
                        "{getRandomFact()}"
                    </p>
                </div>
                
                <div className="flex gap-4">
                    <button
                      onClick={() => {
                          clearAssessmentState(STORAGE_KEY);
                          navigate("/dashboard");
                      }}
                      className="px-8 py-3 rounded-full font-bold text-sm uppercase tracking-widest transition-all text-slate-500 hover:text-white hover:bg-white/5 border border-transparent hover:border-white/10"
                    >
                      Skip to Dashboard
                    </button>
                    <button
                      onClick={() => {
                          clearAssessmentState(STORAGE_KEY);
                          navigate(-1);
                      }}
                      className="px-8 py-3 rounded-full font-bold text-sm uppercase tracking-widest transition-all text-slate-500 hover:text-white hover:bg-white/5 border border-transparent hover:border-white/10"
                    >
                      Maybe Later
                    </button>
                </div>

                 <p className="text-xs text-slate-500 max-w-md mt-4">
                   *External links will open in a new tab. We recommend following the structured path for best results.
                </p>
             </div>
          </motion.div>
        )}

      </div>
    </div>
  );
};

export default ProductBasedAssessment;
