import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { supabase } from "../lib/supabase";
import { questionBank } from "../data/questionBank";
import { generateAssessment, saveAssessmentState, loadAssessmentState, clearAssessmentState } from "../utils/assessmentUtils";
import { getRandomFact } from "../data/learningFacts";

const ProblemSolvingAssessment = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const domain = searchParams.get("domain") || "programming-problems";
  const assessmentId = `problem_${domain}_v3`; // Unique ID for persistence

  const [questions, setQuestions] = useState([]);
  const [currentStep, setCurrentStep] = useState("intro"); // intro, assessment, evaluating, result
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [answers, setAnswers] = useState({});
  const [agentStatus, setAgentStatus] = useState("");
  const [score, setScore] = useState(0);
  const [level, setLevel] = useState("");
  const [fact, setFact] = useState("");
  const isLoaded = useRef(false);

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
        setQuestions(savedState.questions);
        setAnswers(savedState.answers);
        setCurrentQuestionIndex(savedState.currentQuestionIndex);
        setCurrentStep(savedState.currentStep === 'intro' ? 'intro' : savedState.currentStep);
        if (savedState.score) setScore(savedState.score);
        if (savedState.level) setLevel(savedState.level);
    } else {
        const bankDomain = getQuestionBankDomain(domain);
        const newQuestions = generateAssessment(bankDomain, 10);
        setQuestions(newQuestions);
    }
    setFact(getRandomFact());
  }, [domain, assessmentId]);

  useEffect(() => {
    if (questions.length > 0 && currentStep !== 'intro') {
        saveAssessmentState(assessmentId, {
            questions,
            answers,
            currentQuestionIndex,
            currentStep,
            score,
            level
        });
    }
  }, [questions, answers, currentQuestionIndex, currentStep, score, level, assessmentId]);


  const startAssessment = () => {
    setAgentStatus("Problem Setter Agent: Preparing challenges...");
    setTimeout(() => {
      setCurrentStep("assessment");
      setAgentStatus("");
    }, 1500);
  };

  const handleAnswer = (answer) => {
    setAnswers({ ...answers, [currentQuestionIndex]: answer });
  };

  const nextQuestion = () => {
    if (currentQuestionIndex < questions.length - 1) {
      setAgentStatus("Problem Setter Agent: Loading next challenge...");
      setTimeout(() => {
        setCurrentQuestionIndex(prev => prev + 1);
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
      if (answers[index] === q.ans) {
        calculatedScore++;
      }
    });

    const percentage = (calculatedScore / questions.length) * 100;
    let finalLevel = "Beginner";
    if (percentage > 70) finalLevel = "Advanced";
    else if (percentage >= 50) finalLevel = "Intermediate";

    setScore(percentage);
    setLevel(finalLevel);
    setCurrentStep("result");

    // Save to Supabase if user exists (optional, reusing profiles table or creating new one)
    if (user) {
        // Just updating general level for now, could be domain specific in future
       // await supabase.from("profiles").update({ level: finalLevel }).eq("id", user.id);
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

  const domainTitle = getDomainTitle();

  return (
    <div className="min-h-screen bg-[#050B14] text-white flex flex-col items-center justify-center p-6 relative overflow-hidden font-sans selection:bg-green-500/30">
      
      {/* Background Grid with Fade */}
      <div className="absolute inset-0 bg-[url('/grid.svg')] bg-center [mask-image:linear-gradient(180deg,white,rgba(255,255,255,0))] pointer-events-none opacity-50" />
      
      {/* Agent Status Bar */}
      <AnimatePresence>
        {agentStatus && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="fixed top-8 left-1/2 transform -translate-x-1/2 bg-slate-900/90 backdrop-blur-md border border-white/10 px-6 py-3 rounded-full shadow-2xl flex items-center gap-3 z-50"
          >
            <div className="w-2.5 h-2.5 bg-green-400 rounded-full animate-pulse box-shadow-[0_0_10px_#4ADE80]" />
            <span className="text-sm font-semibold text-green-100 tracking-wide font-mono">{agentStatus}</span>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="absolute top-8 left-8 z-50">
         <button
            onClick={() => {
              clearAssessmentState(assessmentId);
              navigate(-1);
            }}
            className="group flex items-center gap-2 px-4 py-2 bg-white/5 hover:bg-white/10 border border-white/10 hover:border-green-500/50 rounded-lg backdrop-blur-md text-slate-400 hover:text-green-400 transition-all duration-300"
         >
           <svg className="w-4 h-4 transform group-hover:-translate-x-1 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor">
             <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
           </svg>
           <span className="text-sm font-medium">Exit Challenge</span>
         </button>
      </div>

      <div className="max-w-3xl w-full relative z-10">
        
        {currentStep === "intro" && (
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-slate-900/50 backdrop-blur-sm border border-white/10 p-10 rounded-3xl shadow-2xl text-center relative overflow-hidden"
          >
            {/* Abstract Tech decoration */}
             <div className="absolute left-0 top-0 opacity-10 transform -translate-x-1/3 -translate-y-1/3 pointer-events-none">
                  <svg width="300" height="300" viewBox="0 0 200 200" fill="none">
                      <rect x="50" y="50" width="100" height="100" stroke="white" strokeWidth="2" strokeDasharray="10 10" transform="rotate(45 100 100)"/>
                      <rect x="70" y="70" width="60" height="60" stroke="green" strokeWidth="2" transform="rotate(45 100 100)"/>
                  </svg>
             </div>

            <div className="inline-block mb-6 px-4 py-1 rounded-full border border-green-500/30 bg-green-500/10 text-green-400 text-sm font-mono tracking-widest uppercase">
              Problem Solving
            </div>

            <h1 className="text-5xl md:text-6xl font-black mb-6 bg-clip-text text-transparent bg-linear-to-b from-white to-slate-500 drop-shadow-sm">
              {domainTitle}
            </h1>
            <p className="text-slate-300 text-lg mb-10 leading-relaxed max-w-2xl mx-auto">
              Test your problem-solving skills in <span className="text-green-300 font-semibold">{domainTitle}</span>. 
              Our agents will evaluate your logic and recommend the best practice platform.
            </p>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12 text-sm">
                <div className="bg-slate-800 p-6 rounded-2xl border border-white/10 hover:border-green-500/30 transition-colors flex flex-col justify-center">
                  <span className="block text-green-400 font-bold text-xs uppercase mb-2 tracking-wider">Did You Know?</span> 
                  <span className="text-slate-300 text-xs italic leading-relaxed">"{fact}"</span>
                </div>
               <div className="bg-slate-800 p-6 rounded-2xl border border-white/10 hover:border-green-500/30 transition-colors">
                 <span className="block text-purple-400 font-bold text-3xl mb-2">Code</span> 
                 <span className="text-slate-400 font-medium">Format</span>
               </div>
               <div className="bg-slate-800 p-6 rounded-2xl border border-white/10 hover:border-green-500/30 transition-colors">
                 <span className="block text-emerald-400 font-bold text-3xl mb-2">AI</span> 
                 <span className="text-slate-400 font-medium">Analysis</span>
               </div>
            </div>
            
            <button
              onClick={startAssessment}
              className="bg-green-600 hover:bg-green-500 text-white text-lg font-bold py-4 px-12 rounded-2xl transition-all shadow-[0_4px_20px_rgba(22,163,74,0.4)] hover:shadow-[0_4px_25px_rgba(22,163,74,0.6)] hover:-translate-y-1"
            >
              Start Challenges
            </button>
          </motion.div>
        )}

        {currentStep === "assessment" && (
          <motion.div
            key="question-card"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="bg-slate-900/50 backdrop-blur-sm border border-white/10 p-8 md:p-10 rounded-3xl shadow-2xl relative overflow-hidden"
          >
             {/* Progress Bar */}
             <div className="absolute top-0 left-0 h-1 bg-slate-800 w-full">
                <motion.div 
                    initial={{ width: 0 }}
                    animate={{ width: `${((currentQuestionIndex + 1) / questions.length) * 100}%` }}
                    className="h-full bg-linear-to-r from-green-500 to-emerald-500"
                />
             </div>

            <div className="flex justify-between items-center mb-8 mt-2">
               <span className="text-slate-400 font-mono text-sm tracking-widest uppercase">
                 Challenge {currentQuestionIndex + 1} / {questions.length}
               </span>
               <span className="text-slate-400 font-mono text-xs uppercase border border-white/10 px-3 py-1 rounded-full bg-white/5">
                 {domainTitle}
               </span>
            </div>

            <h2 className="text-2xl md:text-3xl font-bold mb-10 text-white leading-snug">
              {questions[currentQuestionIndex]?.q}
            </h2>

            <div className="space-y-4 mb-10">
              {questions[currentQuestionIndex]?.options.map((option, idx) => (
                <button
                  key={idx}
                  onClick={() => handleAnswer(option)}
                  className={`w-full text-left p-5 rounded-2xl border transition-all duration-200 flex items-center justify-between group
                    ${answers[currentQuestionIndex] === option 
                      ? "bg-green-600/20 border-green-500 text-white shadow-lg" 
                      : "bg-black/20 border-white/5 hover:border-white/20 text-slate-300 hover:bg-white/5"}`}
                >
                  <span className="text-lg font-medium">{option}</span>
                  {answers[currentQuestionIndex] === option && (
                    <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }}>
                       <div className="bg-green-500 rounded-full p-1 shadow-lg shadow-green-500/50">
                         <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                           <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                         </svg>
                       </div>
                    </motion.div>
                  )}
                </button>
              ))}
            </div>

            <div className="flex justify-end pt-6 border-t border-white/10">
              <button
                onClick={nextQuestion}
                disabled={!answers[currentQuestionIndex]}
                className={`px-8 py-4 rounded-xl font-bold text-lg transition-all shadow-lg
                  ${answers[currentQuestionIndex] 
                    ? "bg-white text-slate-900 hover:scale-[1.02] hover:shadow-xl" 
                    : "bg-slate-800 text-slate-500 cursor-not-allowed"}`}
              >
                {currentQuestionIndex === questions.length - 1 ? "Finish" : "Next Challenge"}
              </button>
            </div>
          </motion.div>
        )}

        {currentStep === "evaluating" && (
          <div className="text-center py-20 bg-slate-900/50 rounded-3xl border border-white/5 backdrop-blur-sm">
             <div className="relative w-24 h-24 mx-auto mb-8">
               <div className="absolute inset-0 border-4 border-slate-700 rounded-full" />
               <div className="absolute inset-0 border-4 border-green-500 rounded-full border-t-transparent animate-spin" />
               <div className="absolute inset-0 flex items-center justify-center">
                 <svg className="w-8 h-8 text-green-500 animate-pulse" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                 </svg>
               </div>
             </div>
             <h3 className="text-3xl font-bold mb-3 text-white">Evaluator Agent Working</h3>
             <p className="text-green-300 text-lg">Analyzing your command over {domainTitle}...</p>
          </div>
        )}

        {currentStep === "result" && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-slate-900/50 backdrop-blur-sm border border-white/10 p-12 rounded-3xl shadow-2xl text-center relative overflow-hidden"
          >
             {/* Glow effect */}
            <div className={`absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-64 h-64 blur-[120px] rounded-full -z-10 opacity-40
                ${level === 'Advanced' ? 'bg-purple-600' : level === 'Intermediate' ? 'bg-yellow-600' : 'bg-green-600'}`} 
            />

             <div className="inline-block p-6 rounded-3xl bg-black/20 border border-white/10 mb-8 backdrop-blur-md shadow-xl">
               <svg className={`w-20 h-20 ${level === 'Advanced' ? 'text-purple-400' : level === 'Intermediate' ? 'text-yellow-400' : 'text-green-400'}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                 <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M5 13l4 4L19 7" />
               </svg>
             </div>

            <h2 className="text-4xl md:text-5xl font-black mb-4 text-white tracking-tight">Challenge Complete</h2>
            <p className="text-slate-400 text-lg mb-12">We have configured your optimal practice ground.</p>

            <div className="bg-black/30 rounded-2xl p-8 mb-10 border border-white/5 backdrop-blur-md">
              <div className="text-xs text-slate-500 uppercase tracking-[0.3em] font-bold mb-4">You are eligible for</div>
              <div className={`text-5xl md:text-6xl font-black mb-8 tracking-tighter drop-shadow-2xl ${
                  level === 'Advanced' ? 'text-transparent bg-clip-text bg-linear-to-b from-purple-300 to-purple-600' : 
                  level === 'Intermediate' ? 'text-transparent bg-clip-text bg-linear-to-b from-yellow-300 to-yellow-600' : 
                   'text-transparent bg-clip-text bg-linear-to-b from-green-300 to-green-600'
              }`}>
                {level} Problems
              </div>
              
              <div className="relative w-full max-w-sm mx-auto h-4 rounded-full bg-slate-800/50 overflow-hidden mb-6">
                 <motion.div 
                    initial={{ width: 0 }}
                    animate={{ width: `${score}%` }}
                    transition={{ duration: 1.5, ease: "easeOut" }}
                    className={`h-full shadow-[0_0_20px_currentColor] ${
                      level === 'Advanced' ? 'bg-linear-to-r from-purple-500 to-indigo-600' : 
                      level === 'Intermediate' ? 'bg-linear-to-r from-yellow-500 to-orange-600' : 'bg-linear-to-r from-green-500 to-emerald-600'
                    }`}
                 />
              </div>

               <p className="text-slate-300 text-xl font-medium">
                Score: <span className="text-white">{Math.round(score)}%</span>
              </p>
            </div>

            <div className="flex gap-4 justify-center mb-12">
              <button
                onClick={() => {
                  clearAssessmentState(assessmentId);
                  navigate("/dashboard?mode=problem");
                }}
                className="px-8 py-4 rounded-xl font-bold text-lg transition-all text-slate-300 hover:text-white hover:bg-white/5 border border-transparent hover:border-white/10"
              >
                Back to Dashboard
              </button>
                    <button
                      onClick={() => {
                        clearAssessmentState(assessmentId);
                         const bankDomain = getQuestionBankDomain(domain);
                         const newQuestions = generateAssessment(bankDomain, 110);
                         setQuestions(newQuestions);
                         setAnswers({});
                         setCurrentQuestionIndex(0);
                         setScore(0);
                         setLevel("");
                         setCurrentStep("intro");
                         isLoaded.current = false;
                      }}
                       className="px-8 py-3 rounded-xl font-bold text-sm uppercase tracking-widest transition-all text-slate-400 hover:text-white hover:bg-white/5 border border-transparent hover:border-white/10"
                    >
                        Retake Challenge
                    </button>
              <button
                onClick={() => setCurrentStep("learning-plan")} 
                className="bg-white text-slate-900 px-8 py-4 rounded-xl font-bold text-lg transition-all shadow-lg hover:scale-[1.02] hover:shadow-xl hover:bg-slate-50"
              >
                See Recommendations
              </button>
            </div>

             <p className="text-xs text-slate-600 max-w-lg mx-auto leading-relaxed">
              *Disclaimer: This assessment is an AI-generated evaluation for educational purposes. 
              Results are indicative of your current problem-solving skills and eligible difficulty level.
            </p>
          </motion.div>
        )}

        {currentStep === "learning-plan" && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-slate-900/50 backdrop-blur-sm border border-white/10 p-10 rounded-3xl shadow-2xl text-center max-w-4xl mx-auto"
          >
             <h2 className="text-4xl font-bold mb-4 text-white">Recommended Resource</h2>
             <p className="text-slate-300 text-lg mb-10">
               Based on your <span className={`font-bold ${
                  level === 'Advanced' ? 'text-purple-400' : 
                  level === 'Intermediate' ? 'text-yellow-400' : 'text-green-400'
               }`}>{level}</span> level, this is the best platform for your growth.
             </p>

             {(() => {
                const resources = {
                  Beginner: {
                    logo: "https://upload.wikimedia.org/wikipedia/commons/4/43/GeeksforGeeks.svg",
                    title: "GeeksforGeeks",
                    description: "Excellent article-based learning and beginner-friendly coding practice.",
                    link: "https://www.geeksforgeeks.org/",
                    buttonColor: "bg-[#2F8D46] hover:bg-[#246B35]",
                    theme: "border-green-500/50 bg-green-500/5",
                    video: "https://www.youtube.com/embed/5_5oE5lGRFc"
                  },
                  Intermediate: {
                    logo: "https://upload.wikimedia.org/wikipedia/commons/1/19/LeetCode_logo_black.png",
                    title: "LeetCode",
                    description: "The gold standard for coding interviews with a vast library of problems.",
                    link: "https://leetcode.com/problemset/all/",
                    buttonColor: "bg-[#FFA116] hover:bg-[#E59113] text-black",
                    theme: "border-yellow-500/50 bg-yellow-500/5",
                    video: "https://www.youtube.com/embed/SqcY0GlETPk"
                  },
                  Advanced: {
                    logo: "https://upload.wikimedia.org/wikipedia/commons/6/65/HackerRank_logo.png",
                    title: "HackerRank",
                    description: "Advanced challenges and domain-specific tracks for mastery.",
                    link: "https://www.hackerrank.com/domains/algorithms",
                    buttonColor: "bg-[#2EC866] hover:bg-[#27B059]",
                    theme: "border-green-600/50 bg-green-600/5",
                     video: "https://www.youtube.com/embed/zHxt7Ta3914"
                  }
                };

                const resource = resources[level] || resources.Beginner;

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
                     
                     <p className="text-slate-600 mb-6 text-sm leading-relaxed">
                       {resource.description}
                     </p>
                     <a 
                       href={resource.link} 
                       target="_blank" 
                       rel="noopener noreferrer"
                       className={`w-full block text-white font-bold py-3 rounded-xl transition-colors ${resource.buttonColor} ${resource.title === "LeetCode" ? "text-slate-900" : "text-white"}`}
                     >
                       Start Practicing
                     </a>
                   </div>

                   {/* Video Card */}
                   <div className="bg-slate-800 rounded-2xl p-4 h-full border border-slate-700 shadow-lg flex flex-col">
                      <h3 className="text-white text-xl font-bold mb-4 text-left px-2">Recommended Video</h3>
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
                <div className="bg-green-500/10 border border-green-500/20 px-6 py-4 rounded-xl max-w-2xl mb-6">
                    <p className="text-green-200 text-sm font-bold uppercase mb-2 tracking-wider">Did You Know?</p>
                    <p className="text-green-100 text-sm font-medium italic leading-relaxed">
                        "{fact}"
                    </p>
                </div>

                <div className="flex gap-4">
                    <button
                      onClick={() => {
                        clearAssessmentState(assessmentId);
                        navigate("/dashboard?mode=problem");
                      }}
                       className="px-8 py-3 rounded-xl font-bold text-sm uppercase tracking-widest transition-all text-slate-400 hover:text-white hover:bg-white/5 border border-transparent hover:border-white/10"
                    >
                      Return to Dashboard
                    </button>
                     <button
                      onClick={() => {
                        clearAssessmentState(assessmentId);
                        navigate(-1);
                      }}
                       className="px-8 py-3 rounded-xl font-bold text-sm uppercase tracking-widest transition-all text-slate-500 hover:text-slate-300 hover:bg-white/5 border border-transparent hover:border-white/10"
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

export default ProblemSolvingAssessment;
