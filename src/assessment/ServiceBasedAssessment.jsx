import { useState, useEffect, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { companyConfig } from "../lib/companyConfig";
import { generateAssessment, loadAssessmentState, saveAssessmentState, clearAssessmentState } from "../utils/assessmentUtils";
import { getRandomFact } from "../data/learningFacts";

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
  const [timeLeft, setTimeLeft] = useState(config.timeLimit);
  const [agentMessage, setAgentMessage] = useState("");
  
  // Results
  const [tier, setTier] = useState("");
  const [readinessScore, setReadinessScore] = useState(0);
  const [domainScores, setDomainScores] = useState({});

  // Initialize Assessment (Load or Generate)
  useEffect(() => {
    const savedState = loadAssessmentState(STORAGE_KEY);
    
    if (savedState && savedState.questionsDB && Object.keys(savedState.questionsDB).length > 0) {
        // Restore session
        setQuestionsDB(savedState.questionsDB);
        setAnswers(savedState.answers || {});
        setTimeLeft(savedState.timeLeft || config.timeLimit);
        setStep(savedState.step || "intro");
        setActiveSection(savedState.activeSection || "quant");
    } else {
        // Generate new session
        const newDB = {};
        // Default domains for Service based: quant, logical, verbal, planning, cs
        const domains = ["quant", "logical", "verbal", "programming", "cs"];
        const countPerDomain = Math.floor(10 / domains.length); // 12 questions each
        domains.forEach(domain => {
             newDB[domain] = generateAssessment(domain, countPerDomain);
        });
        setQuestionsDB(newDB);
    }
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

  const startTest = () => {
    setAgentMessage(`Teacher Agent: Configuring ${config.name} environment...`);
    
    // Ensure questions are ready
    if (Object.keys(questionsDB).length === 0) {
        const newDB = {};
        const domains = ["quant", "logical", "verbal", "programming", "cs"];
        const countPerDomain = Math.floor(10 / domains.length);
        domains.forEach(domain => {
             newDB[domain] = generateAssessment(domain, countPerDomain);
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
    let calculatedTier = "Foundation";
    // Elite: High score AND decent performance in heaviest domain
    const heaviestDomain = Object.entries(config.domains).reduce((a, b) => a[1].weight > b[1].weight ? a : b)[0];
    
    if (finalScore > 85 && rawScores[heaviestDomain] > 70) {
        calculatedTier = "Elite";
    } else if (finalScore > 65) {
        calculatedTier = "Professional";
    }
    
    setTier(calculatedTier);
  };

  // Learning Plan Resources
  const learningResources = {
    Foundation: {
        logo: "https://upload.wikimedia.org/wikipedia/commons/4/43/GeeksforGeeks.svg",
        title: "Aptitude Basics",
        description: "Master the fundamentals of quantitative aptitude and logical reasoning.",
        readinessTier: "Foundation",
        simulationType: "Topic-wise Drills",
        link: "https://www.geeksforgeeks.org/aptitude-questions-and-answers/",
        video: "https://www.youtube.com/embed/5_5oE5lGRFc"
    },
    Professional: {
        logo: "https://upload.wikimedia.org/wikipedia/commons/1/19/LeetCode_logo_black.png",
        title: "TCS/Infosys Mock",
        description: "Company-specific patterns including pseudo-code and verbal ability.",
        readinessTier: "Professional",
        simulationType: "Full-length Mocks",
        link: "https://leetcode.com/discuss/interview-question",
        video: "https://www.youtube.com/embed/SqcY0GlETPk"
    },
    Elite: {
        logo: "https://upload.wikimedia.org/wikipedia/commons/6/65/HackerRank_logo.png",
        title: "Advanced Simulation",
        description: "High-difficulty scenarios for top-tier service company roles (e.g. TCS Digital).",
        readinessTier: "Elite",
        simulationType: "High-Package Role Prep",
        link: "https://www.hackerrank.com/dashboard",
        video: "https://www.youtube.com/embed/zHxt7Ta3914"
    }
  };

  return (
    <div className="min-h-screen bg-[#050B14] text-white flex flex-col items-center justify-center p-6 relative overflow-hidden font-sans selection:bg-blue-500/30">
      
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
              navigate(-1);
            }}
            className="group flex items-center gap-2 px-4 py-2 bg-white/5 hover:bg-white/10 border border-white/10 hover:border-cyan-500/50 rounded-lg backdrop-blur-md text-slate-400 hover:text-cyan-400 transition-all duration-300"
         >
           <svg className="w-4 h-4 transform group-hover:-translate-x-1 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor">
             <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
           </svg>
           <span className="text-sm font-medium">Exit Simulation</span>
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
               className="bg-slate-900/50 backdrop-blur-sm border border-white/10 p-10 rounded-3xl shadow-2xl text-center max-w-3xl mx-auto relative overflow-hidden"
            >
                 {/* Abstract Tech decoration */}
                 <div className="absolute right-0 top-0 opacity-10 transform translate-x-1/3 -translate-y-1/3 pointer-events-none">
                      <svg width="300" height="300" viewBox="0 0 200 200" fill="none">
                          <circle cx="100" cy="100" r="80" stroke="white" strokeWidth="2" strokeDasharray="10 10"/>
                          <circle cx="100" cy="100" r="40" stroke="blue" strokeWidth="2"/>
                      </svg>
                 </div>

                <div className="inline-block mb-6 px-4 py-1 rounded-full border border-blue-500/30 bg-blue-500/10 text-blue-400 text-sm font-mono tracking-widest uppercase">
                  Exam Preparation
                </div>

                <h1 className={`text-5xl md:text-6xl font-black mb-6 bg-clip-text text-transparent bg-linear-to-r ${config.color} drop-shadow-sm`}>
                  {config.name}
                </h1>
                
                <div className="grid md:grid-cols-3 gap-6 mb-10 text-left">
                    <div className="p-6 bg-slate-800/50 rounded-2xl border border-white/10 hover:border-blue-500/30 transition-colors">
                        <div className="text-blue-400 font-bold mb-2 text-sm uppercase tracking-wider">Pattern</div>
                        <ul className="text-xs text-slate-400 space-y-2">
                            {Object.entries(config.domains).map(([key, d]) => d.weight > 0 && (
                                <li key={key} className="flex justify-between border-b border-white/5 pb-1">
                                    <span>{d.label}</span>
                                    <span className="text-white font-mono">{d.weight * 100}%</span>
                                </li>
                            ))}
                        </ul>
                    </div>
                    <div className="p-6 bg-slate-800/50 rounded-2xl border border-white/10 hover:border-purple-500/30 transition-colors">
                        <div className="text-purple-400 font-bold mb-2 text-sm uppercase tracking-wider">Duration</div>
                        <p className="text-2xl font-light text-white">{config.timeLimit / 60} <span className="text-sm text-slate-500">Mins</span></p>
                    </div>
                    <div className="bg-slate-800 p-6 rounded-2xl border border-white/10 hover:border-indigo-500/30 transition-colors">
                        <div className="text-emerald-400 font-bold mb-2 uppercase tracking-wider text-xs">Coverage</div>
                         <span className="block text-indigo-400 font-bold text-3xl mb-2">60</span> 
                         <span className="text-slate-400 font-medium">Questions</span>
                    </div>
                </div>

                {agentMessage && (
                    <div className="mb-6 text-blue-300 font-mono animate-pulse bg-blue-900/20 py-2 rounded-lg">{agentMessage}</div>
                )}
                
                <button 
                   onClick={startTest}
                   className={`text-white font-bold py-4 px-12 rounded-xl text-lg transition-all shadow-lg hover:shadow-2xl hover:-translate-y-1 bg-linear-to-r ${config.color}`}
                >
                    Start Simulated Exam
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
                                    ? 'bg-blue-600/20 border-blue-500 text-white shadow-lg' 
                                    : 'bg-slate-900/50 border-white/5 text-slate-400 hover:border-white/20 hover:bg-white/5'}`}
                        >
                            <span>{config.domains[key].label}</span>
                            <span className={`text-xs px-2 py-0.5 rounded-md ${activeSection === key ? 'bg-blue-500 text-white' : 'bg-black/30 group-hover:bg-white/10'}`}>
                                {Object.keys(answers[key] || {}).length}/{questionsDB[key].length}
                            </span>
                        </button>
                    ))}
                    <button 
                        onClick={submitTest}
                        className="mt-auto bg-emerald-600 hover:bg-emerald-500 text-white p-4 rounded-xl font-bold transition-all shadow-lg hover:shadow-emerald-500/20"
                    >
                        Submit Assessment
                    </button>
                </div>

                {/* Question Area */}
                <div className="flex-1 bg-slate-900/50 border border-white/10 rounded-3xl p-8 shadow-2xl backdrop-blur-sm overflow-y-auto custom-scrollbar">
                    <h3 className="text-xl font-bold mb-8 capitalize text-blue-300 border-b border-white/5 pb-4 sticky top-0 bg-slate-900/90 backdrop-blur-md z-20 py-2">
                        {config.domains[activeSection]?.label} Section
                    </h3>
                    <div className="space-y-8">
                        {questionsDB[activeSection].map((q, idx) => (
                            <div key={q.id} className="bg-black/20 p-6 rounded-2xl border border-white/5 transition-all hover:border-white/10">
                                <p className="text-lg mb-6 text-slate-200 leading-relaxed font-light">
                                    <span className="text-slate-500 font-mono mr-3">0{idx + 1}.</span>
                                    {q.q}
                                </p>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    {q.options.map(opt => (
                                        <button
                                            key={opt}
                                            onClick={() => handleAnswer(activeSection, q.id, opt)}
                                            className={`p-4 rounded-xl text-left border transition-all flex items-center
                                                ${answers[activeSection]?.[q.id] === opt
                                                    ? 'bg-blue-500/20 border-blue-500 text-white shadow-md'
                                                    : 'bg-slate-800/50 border-white/5 text-slate-400 hover:border-white/20 hover:bg-white/5'}`}
                                        >
                                            <div className={`w-4 h-4 rounded-full border mr-3 flex items-center justify-center shrink-0
                                                ${answers[activeSection]?.[q.id] === opt ? 'border-blue-400' : 'border-slate-600'}`}>
                                                {answers[activeSection]?.[q.id] === opt && <div className="w-2 h-2 rounded-full bg-blue-400"/>}
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
               className="bg-slate-900/50 backdrop-blur-sm border border-white/10 p-10 rounded-3xl shadow-2xl text-center relative overflow-hidden max-w-5xl mx-auto"
            >
                {/* Glow effect */}
                <div className={`absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 blur-[150px] rounded-full -z-10 opacity-30
                    ${tier === 'Elite' ? 'bg-purple-600' : tier === 'Professional' ? 'bg-blue-600' : 'bg-orange-600'}`} 
                />

                <div className="grid md:grid-cols-2 gap-12 items-center">
                    
                    {/* Left: Score */}
                    <div className="relative">
                        <div className="uppercase tracking-[0.2em] text-xs font-bold text-slate-500 mb-6">You are eligible for</div>
                        <div className={`text-8xl font-black mb-4 tracking-tighter
                            ${tier === 'Elite' ? 'text-transparent bg-clip-text bg-linear-to-b from-purple-300 to-purple-600' : 
                              tier === 'Professional' ? 'text-transparent bg-clip-text bg-linear-to-b from-blue-300 to-blue-600' : 
                              'text-transparent bg-clip-text bg-linear-to-b from-orange-300 to-orange-600'}`}>
                            {Math.round(readinessScore)}<span className="text-3xl align-top opacity-50">%</span>
                        </div>
                        <div className={`inline-block px-6 py-2 rounded-full text-sm font-bold border uppercase tracking-wide
                             ${tier === 'Elite' ? 'border-purple-500/50 text-purple-300 bg-purple-500/10' : 
                               tier === 'Professional' ? 'border-blue-500/50 text-blue-300 bg-blue-500/10' : 
                               'border-orange-500/50 text-orange-300 bg-orange-500/10'}`}>
                            {tier} Candidate
                        </div>
                    </div>

                    {/* Right: Breakdown */}
                    <div className="text-left bg-black/20 p-8 rounded-2xl border border-white/5">
                        <h4 className="text-white font-bold mb-6 flex items-center gap-3">
                            <span className="w-2 h-8 bg-blue-500 rounded-full"/>
                            Domain Breakdown
                        </h4>
                        <div className="space-y-5">
                            {Object.entries(domainScores).map(([key, score]) => config.domains[key].weight > 0 && (
                                <div key={key}>
                                    <div className="flex justify-between text-sm mb-2 text-slate-300 capitalize font-medium">
                                        <span>{config.domains[key].label}</span>
                                        <span>{Math.round(score)}%</span>
                                    </div>
                                    <div className="h-2 bg-slate-800 rounded-full overflow-hidden">
                                        <div 
                                            className={`h-full rounded-full transition-all duration-1000 ${score > 75 ? 'bg-emerald-500' : score > 40 ? 'bg-yellow-500' : 'bg-red-500'}`} 
                                            style={{ width: `${score}%` }}
                                        />
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>

                <div className="mt-12 flex gap-4 justify-center mb-8">
                     <button 
                        onClick={() => {
                            clearAssessmentState(STORAGE_KEY);
                            navigate("/service-selection");
                        }}
                        className="px-8 py-4 rounded-xl font-bold text-lg transition-all text-slate-400 hover:text-white hover:bg-white/5 border border-transparent hover:border-white/10"
                    >
                        Try Another Company
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
                        className="px-8 py-4 rounded-xl font-bold text-lg transition-all text-slate-400 hover:text-white hover:bg-white/5 border border-transparent hover:border-white/10"
                    >
                        Retake Assessment
                    </button>
                    <button
                        onClick={() => setStep("learning-plan")} 
                        className="bg-white text-slate-900 px-10 py-4 rounded-xl font-bold text-lg transition-all shadow-lg hover:scale-[1.02] hover:shadow-xl hover:bg-blue-50"
                    >
                        View Personalized Plan
                    </button>
                </div>

                <p className="text-xs text-slate-600 max-w-lg mx-auto leading-relaxed">
                    *Disclaimer: AI-generated evaluation for educational purposes. 
                    Results are indicative of current readiness.
                </p>
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
                  tier === 'Elite' ? 'text-purple-400' : 
                  tier === 'Professional' ? 'text-blue-400' : 'text-orange-400'
               }`}>{tier}</span> status, we have curated this specific preparation path.
             </p>

             {(() => {
                const resource = learningResources[tier] || learningResources.Foundation;

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
