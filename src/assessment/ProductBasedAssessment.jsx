import { useState, useEffect, useMemo, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { companyConfig } from "../lib/companyConfig";
import BackButton from "../components/ui/BackButton";
import { generateAssessment, loadAssessmentState, saveAssessmentState, clearAssessmentState } from "../utils/assessmentUtils";
import { getRandomFact } from "../data/learningFacts";

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
  const [timeLeft, setTimeLeft] = useState(config.timeLimit);
  const [agentMessage, setAgentMessage] = useState("");
  
  // Results
  const [tier, setTier] = useState("");
  const [readinessScore, setReadinessScore] = useState(0);
  const [domainScores, setDomainScores] = useState({});

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
    } else {
        // Generate new session (but waiting for Start)
        // We will generate questions when Start Test is clicked to ensure freshness if desired, 
        // OR pre-generate here. Let's pre-generate structure to be ready.
        const newDB = {};
        const totalQuestions = 60;
        Object.keys(config.domains).forEach(domain => {
            const weight = config.domains[domain].weight || 0;
            if (weight > 0) {
                const count = Math.max(1, Math.round(totalQuestions * weight));
                newDB[domain] = generateAssessment(domain, count); 
            }
        });
        setQuestionsDB(newDB);
        setActiveSection(Object.keys(config.domains).find(k => config.domains[k].weight > 0) || "dsa_hard");
    }
  }, [config, STORAGE_KEY]); // Run once on mount/config change

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

  const startTest = () => {
    setAgentMessage(`Teacher Agent: Provisioning ${config.name} sandbox...`);
    // If questions were not generated correctly, regenerate
    if (Object.keys(questionsDB).length === 0) {
         const newDB = {};
         const totalQuestions = 60;
        Object.keys(config.domains).forEach(domain => {
            const weight = config.domains[domain].weight || 0;
            if (weight > 0) {
                const count = Math.max(1, Math.round(totalQuestions * weight));
                newDB[domain] = generateAssessment(domain, count);
            }
        });
        setQuestionsDB(newDB);
    }

    setTimeout(() => {
      setStep("test");
      setAgentMessage("");
    }, 2000);
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
      { msg: "Evaluator Agent: Running test cases on submitted logic...", delay: 2000 },
      { msg: `Evaluator Agent: Analyzing System Design trade-offs...`, delay: 4000 },
      { msg: "Knowledge Gap Agent: Checking Depth vs Breadth...", delay: 5500 },
      { msg: "Strategy Agent: Calculating FAANG Hireability Score...", delay: 7000 }
    ];

    let accumDelay = 0;
    sequence.forEach(({ msg, delay }) => {
      setTimeout(() => setAgentMessage(msg), accumDelay);
      accumDelay = delay;
    });

    setTimeout(() => {
        calculateResults();
        setStep("result");
        clearAssessmentState(STORAGE_KEY); // Clear session on finish
    }, accumDelay + 1000);
  };

  const calculateResults = () => {
    let rawScores = {};
    let weightedScore = 0;
    let totalWeight = 0;

    // 1. Calculate Raw Scores per Domain
    Object.keys(questionsDB).forEach(domain => {
        const questions = questionsDB[domain] || [];
        if (questions.length === 0) return;

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

    // Normalize
    const finalScore = totalWeight > 0 ? weightedScore / totalWeight : 0;
    
    setReadinessScore(finalScore);
    setDomainScores(rawScores);

    // 3. Determine Tier (Strict for Product Companies)
    let calculatedTier = "Review Needed";
    
    if (finalScore > 85) {
        calculatedTier = "Hire";
    } else if (finalScore > 70) {
        calculatedTier = "Leaning Hire";
    } else if (finalScore > 50) {
        calculatedTier = "Leaning No Hire";
    } else {
        calculatedTier = "No Hire"; 
    }
    
    setTier(calculatedTier);
  };

  // Learning Resources logic for Product
  const getRefinedResource = () => {
      // Logic: Hire/Leaning Hire -> Staff Path (Design heavy). Else -> Senior Refresher (DSA heavy).
      if (tier === 'Hire' || tier === 'Leaning Hire') {
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
    <div className="min-h-screen bg-[#050B14] text-white flex flex-col items-center justify-center p-6 relative overflow-hidden font-sans selection:bg-yellow-500/30">
      
      {/* Background decoration */}
      <div className={`absolute top-0 left-0 w-full h-[500px] blur-[120px] -z-10 bg-linear-to-b ${config.color} opacity-10 pointer-events-none`} />
      
      {/* Exit Navigation */}
      <div className="absolute top-8 left-8 z-50">
         <button
            onClick={() => {
              clearAssessmentState(STORAGE_KEY);
              navigate(-1); // Or navigate('/product-selection') to be safer
            }}
            className="group flex items-center gap-2 px-4 py-2 bg-white/5 hover:bg-white/10 border border-white/10 hover:border-cyan-500/50 rounded-lg backdrop-blur-md text-slate-400 hover:text-cyan-400 transition-all duration-300"
         >
           <svg className="w-4 h-4 transform group-hover:-translate-x-1 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor">
             <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
           </svg>
           <span className="text-sm font-medium">Exit Interview</span>
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
            <div className={`w-2.5 h-2.5 rounded-full animate-pulse ${step === 'processing' ? 'bg-orange-400 box-shadow-[0_0_10px_#FB923C]' : 'bg-yellow-400 box-shadow-[0_0_10px_#FACC15]'}`} />
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
               initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}
               className="bg-slate-900/50 backdrop-blur-sm border border-white/10 p-12 rounded-3xl text-center max-w-4xl mx-auto shadow-2xl relative overflow-hidden"
            >
                {/* Decoration */}
                <div className="absolute top-0 left-0 w-full h-1 bg-linear-to-r from-transparent via-white/20 to-transparent" />

                <div className="w-20 h-20 mx-auto mb-6 rounded-2xl bg-linear-to-br from-yellow-500 to-orange-600 flex items-center justify-center text-3xl font-bold text-white shadow-lg shadow-orange-500/30">
                    {companyId === 'google' ? 'G' : companyId === 'meta' ? 'M' : companyId === 'amazon' ? 'A' : 'M'}
                </div>
                
                <h2 className="text-5xl font-black mb-4 text-white tracking-tight">Technical Interview Simulation</h2>
                <p className="text-xl text-slate-400 mb-10 max-w-2xl mx-auto font-light leading-relaxed">{config.description}</p>

                <div className="grid md:grid-cols-3 gap-6 mb-12 text-left">
                    <div className="p-6 bg-slate-800/40 rounded-2xl border border-white/5 hover:bg-slate-800/60 transition-colors">
                        <div className="text-yellow-400 font-bold mb-2 uppercase tracking-wider text-xs">High Weightage</div>
                        <ul className="text-sm text-slate-300 space-y-2 font-mono">
                            {Object.entries(config.domains).map(([key, d]) => d.weight > 0.25 && (
                                <li key={key} className="flex justify-between border-b border-white/5 pb-1">
                                    <span>{d.label}</span>
                                    <span className="text-white">{d.weight * 100}%</span>
                                </li>
                            ))}
                        </ul>
                    </div>
                    <div className="p-6 bg-slate-800/40 rounded-2xl border border-white/5 hover:bg-slate-800/60 transition-colors">
                        <div className="text-blue-400 font-bold mb-2 uppercase tracking-wider text-xs">Challenge</div>
                        <p className="text-sm text-slate-400 leading-relaxed">Questions designed to test Scalability trade-offs and edge cases.</p>
                    </div>
                    <div className="bg-slate-800 p-6 rounded-2xl border border-white/10 hover:border-purple-500/30 transition-colors">
                  <span className="block text-purple-400 font-bold text-3xl mb-2">60</span> 
                  <span className="text-slate-400 font-medium">Questions</span>
                </div>
                </div>

                {agentMessage && (
                    <div className="mb-8 text-yellow-300 font-mono animate-pulse bg-yellow-900/20 py-2 rounded-lg border border-yellow-500/20">{agentMessage}</div>
                )}
                
                <button 
                   onClick={startTest}
                   className={`text-white font-bold py-5 px-16 rounded-2xl text-xl transition-all shadow-[0_4px_20px_rgba(255,165,0,0.3)] hover:shadow-[0_8px_30px_rgba(255,165,0,0.4)] hover:-translate-y-1 bg-linear-to-r ${config.color}`}
                >
                    Begin Assessment
                </button>
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
                <div className="flex-1 bg-slate-900/50 border border-white/10 rounded-3xl p-8 shadow-2xl backdrop-blur-sm overflow-y-auto custom-scrollbar">
                    <h3 className="text-2xl font-bold mb-8 text-white border-b border-white/5 pb-4 flex items-center justify-between sticky top-0 bg-slate-900/90 backdrop-blur-md z-20 py-4 mt-0">
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
                                    {q.options.map(opt => (
                                        <button
                                            key={opt}
                                            onClick={() => handleAnswer(activeSection, q.id, opt)}
                                            className={`w-full p-4 rounded-xl text-left border transition-all flex items-center group/btn
                                                ${answers[activeSection]?.[q.id] === opt
                                                    ? 'bg-yellow-500/10 border-yellow-500/50 text-yellow-100'
                                                    : 'bg-black/20 border-white/5 text-slate-400 hover:border-white/20 hover:text-white'}`}
                                        >
                                            <div className={`w-5 h-5 rounded-full border mr-4 flex items-center justify-center shrink-0 transition-colors
                                                ${answers[activeSection]?.[q.id] === opt ? 'border-yellow-500' : 'border-slate-600 group-hover/btn:border-slate-400'}`}>
                                                {answers[activeSection]?.[q.id] === opt && <div className="w-2.5 h-2.5 rounded-full bg-yellow-500 shadow-[0_0_10px_#EAB308]"/>}
                                            </div>
                                            {opt}
                                        </button>
                                    ))}
                                </div>
                            </div>
                        ))}
                    </div>
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
                        ${tier.includes('Hire') ? 'bg-green-500' : 'bg-red-500'}`} 
                    />

                    <div className="p-12 text-center border-b border-white/5 bg-linear-to-b from-slate-800/50 to-slate-900/50 backdrop-blur-xl">
                        <div className="uppercase tracking-[0.2em] text-xs font-bold text-slate-400 mb-6">You are eligible for</div>
                        <h2 className={`text-7xl font-black mb-6 tracking-tight ${tier.includes('Hire') ? 'text-transparent bg-clip-text bg-linear-to-b from-green-300 to-green-600' : 'text-slate-400/80'}`}>
                            {tier}
                        </h2>
                        <div className="inline-flex items-center gap-2 px-5 py-2 rounded-full bg-white/5 border border-white/10 text-slate-300 font-mono text-sm">
                            <span className={readinessScore > 70 ? 'text-green-400' : 'text-orange-400'}>●</span>
                            Match Score: {Math.round(readinessScore)}%
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
                                    <div className="p-2 rounded-lg bg-blue-500/10 text-blue-500">
                                       <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                                       </svg>
                                    </div>
                                    Action Plan
                                </h4>
                                {readinessScore < 70 ? (
                                    <div className="p-6 rounded-2xl bg-orange-500/10 border border-orange-500/20 text-sm">
                                        <p className="text-orange-200 mb-2 font-bold text-base">Gap: System Design & Algorithms</p>
                                        <p className="text-slate-400 leading-relaxed">Top tier companies require deep understanding of trade-offs. Review "Designing Data Intensive Applications" and practice Hard DP problems.</p>
                                    </div>
                                ) : (
                                    <div className="p-6 rounded-2xl bg-green-500/10 border border-green-500/20 text-sm">
                                        <p className="text-green-200 mb-2 font-bold text-base">Ready for Mock Interviews</p>
                                        <p className="text-slate-400 leading-relaxed">Your technical baseline implies readiness. Focus on speed and communication style now.</p>
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
                  tier.includes('Hire') ? 'text-green-400' : 'text-orange-400'
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
