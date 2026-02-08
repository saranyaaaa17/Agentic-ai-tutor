import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { supabase } from "../lib/supabase";
import BackButton from "../components/ui/BackButton";
import { questionBank } from "../data/questionBank";
import { generateAssessment, saveAssessmentState, loadAssessmentState, clearAssessmentState } from "../utils/assessmentUtils";


const Assessment = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const domain = searchParams.get("domain") || "dsa";
  const assessmentId = `concept_${domain}_v3`; // Unique ID for persistence
  const [questions, setQuestions] = useState([]);
  const [currentStep, setCurrentStep] = useState("intro"); // intro, assessment, evaluating, result
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [answers, setAnswers] = useState({});
  const [agentStatus, setAgentStatus] = useState("");
  const [score, setScore] = useState(0);
  const [level, setLevel] = useState("");

  const isLoaded = useRef(false);

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
        setQuestions(savedState.questions);
        setAnswers(savedState.answers);
        setCurrentQuestionIndex(savedState.currentQuestionIndex);
        setCurrentStep(savedState.currentStep === 'intro' ? 'intro' : savedState.currentStep);
        if (savedState.score) setScore(savedState.score);
        if (savedState.level) setLevel(savedState.level);
    } else {
        // Generate new assessment
        const bankDomain = getQuestionBankDomain(domain);
        const newQuestions = generateAssessment(bankDomain, 10); // Generate 10 questions
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
            level
        });
    }
  }, [questions, answers, currentQuestionIndex, currentStep, score, level, assessmentId]);



  const startAssessment = () => {
    setAgentStatus("Teacher Agent: Generating questions...");
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
      setAgentStatus("Teacher Agent: Fetching next question...");
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
    setAgentStatus("Evaluator Agent: Analyzing responses...");
    
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

    // Save to Supabase if user exists
    if (user) {
       // await supabase.from("profiles").update({ level: finalLevel }).eq("id", user.id);
    }
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
    <div className="min-h-screen bg-[#050B14] text-white flex flex-col items-center justify-center p-6 relative overflow-hidden font-sans selection:bg-blue-500/30">
      
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
            <div className="w-2.5 h-2.5 bg-blue-400 rounded-full animate-pulse box-shadow-[0_0_10px_#60A5FA]" />
            <span className="text-sm font-semibold text-blue-100 tracking-wide font-mono">{agentStatus}</span>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="absolute top-8 left-8 z-50">
         <button
            onClick={() => {
              clearAssessmentState(assessmentId);
              navigate(-1);
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
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-slate-900/50 backdrop-blur-sm border border-white/10 p-10 rounded-3xl shadow-2xl text-center relative overflow-hidden"
          >
            {/* Abstract Tech decoration */}
             <div className="absolute right-0 top-0 opacity-10 transform translate-x-1/3 -translate-y-1/3 pointer-events-none">
                  <svg width="300" height="300" viewBox="0 0 200 200" fill="none">
                      <circle cx="100" cy="100" r="80" stroke="white" strokeWidth="2" strokeDasharray="10 10"/>
                      <circle cx="100" cy="100" r="40" stroke="blue" strokeWidth="2"/>
                  </svg>
             </div>

            <div className="inline-block mb-6 px-4 py-1 rounded-full border border-blue-500/30 bg-blue-500/10 text-blue-400 text-sm font-mono tracking-widest uppercase">
              Concept Mastery
            </div>

            <h1 className="text-5xl md:text-6xl font-black mb-6 bg-clip-text text-transparent bg-linear-to-b from-white to-slate-500 drop-shadow-sm">
              {getDomainTitle()}
            </h1>
            <p className="text-slate-300 text-lg mb-10 leading-relaxed max-w-2xl mx-auto">
              Our <span className="text-blue-300 font-semibold">Teacher Agent</span> will guide you through a series of questions, 
              and our <span className="text-emerald-300 font-semibold">Evaluator Agent</span> will analyze your performance in real-time.
            </p>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12 text-sm">
                <div className="bg-slate-800 p-6 rounded-2xl border border-white/10 hover:border-blue-500/30 transition-colors flex flex-col h-full justify-center items-center">
                  <span className="block text-blue-400 font-bold text-xs uppercase mb-3 tracking-wider">Core Skills</span> 
                  <div className="flex flex-wrap gap-2 justify-center">
                      {getCoreSkills().map((skill, i) => (
                          <span key={i} className="px-3 py-1.5 bg-blue-500/10 text-blue-300 rounded-lg text-xs font-bold border border-blue-500/20">{skill}</span>
                      ))}
                  </div>
                </div>
               <div className="bg-slate-800 p-6 rounded-2xl border border-white/10 hover:border-blue-500/30 transition-colors flex flex-col h-full justify-center">
                 <span className="block text-purple-400 font-bold text-3xl mb-1">MCQ</span> 
                 <span className="text-slate-400 font-medium text-xs uppercase tracking-wider">Format</span>
               </div>
               <div className="bg-slate-800 p-6 rounded-2xl border border-white/10 hover:border-blue-500/30 transition-colors flex flex-col h-full justify-center">
                 <span className="block text-emerald-400 font-bold text-3xl mb-1">AI</span> 
                 <span className="text-slate-400 font-medium text-xs uppercase tracking-wider">Analysis</span>
               </div>
            </div>

            <button
              onClick={startAssessment}
              className="bg-blue-600 hover:bg-blue-500 text-white text-lg font-bold py-4 px-12 rounded-2xl transition-all shadow-[0_4px_20px_rgba(37,99,235,0.4)] hover:shadow-[0_4px_25px_rgba(37,99,235,0.6)] hover:-translate-y-1"
            >
              Start Assessment
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
                    className="h-full bg-linear-to-r from-blue-500 to-cyan-500"
                />
             </div>

            <div className="flex justify-between items-center mb-8 mt-2">
               <div className="flex flex-col">
                   <span className="text-slate-400 font-mono text-sm tracking-widest uppercase">
                     Question {currentQuestionIndex + 1} / {questions.length}
                   </span>
                   {/* Live Mastery Stats */}
                   <div className="flex gap-3 mt-2 text-xs font-mono font-bold">
                       {(() => {
                           const answeredCount = Object.keys(answers).filter(key => parseInt(key) < currentQuestionIndex).length;
                           if (answeredCount === 0) return <span className="text-slate-600">Waiting for data...</span>;

                           let correct = 0;
                           Object.entries(answers).forEach(([idx, ans]) => {
                               if (parseInt(idx) < currentQuestionIndex && questions[idx]?.ans === ans) correct++;
                           });
                           
                           // Simple pseudo-mastery for visual feedback: (Accuracy * 0.8) + (Progress * 0.2)
                           // Or just raw accuracy for transparency in strict assessment
                           const accuracy = (correct / answeredCount) || 0;
                           const currentMastery = (0.5 * 0.7) + (accuracy * 0.3); // Starting at 0.5, simple step update simulation
                           // Actually, let's just show Accuracy for the Assessment to be precise
                           
                           return (
                               <>
                                <span className={accuracy < 0.5 ? "text-yellow-400" : "text-blue-400"}>
                                    Accuracy: {Math.round(accuracy * 100)}%
                                </span>
                                <span className="text-slate-600">|</span>
                                <span className={correct > (answeredCount / 2) ? "text-green-400" : "text-slate-400"}>
                                    {correct}/{answeredCount} Correct
                                </span>
                               </>
                           )
                       })()}
                   </div>
               </div>
               <span className="text-slate-400 font-mono text-xs uppercase border border-white/10 px-3 py-1 rounded-full bg-white/5">
                 {getDomainTitle()}
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
                      ? "bg-blue-600/20 border-blue-500 text-white shadow-lg" 
                      : "bg-black/20 border-white/5 hover:border-white/20 text-slate-300 hover:bg-white/5"}`}
                >
                  <span className="text-lg font-medium">{option}</span>
                  {answers[currentQuestionIndex] === option && (
                    <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }}>
                       <div className="bg-blue-500 rounded-full p-1 shadow-lg shadow-blue-500/50">
                         <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                           <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                         </svg>
                       </div>
                    </motion.div>
                  )}
                </button>
              ))}
            </div>

            <div className="flex justify-between pt-6 border-t border-white/10">
              <button
                onClick={() => setCurrentQuestionIndex(prev => Math.max(0, prev - 1))}
                disabled={currentQuestionIndex === 0}
                className={`px-6 py-4 rounded-xl font-bold text-lg transition-all
                  ${currentQuestionIndex === 0
                    ? "text-slate-600 cursor-not-allowed" 
                    : "text-slate-400 hover:text-white hover:bg-white/5"}`}
              >
                Previous
              </button>

              <button
                onClick={nextQuestion}
                disabled={!answers[currentQuestionIndex]}
                className={`px-8 py-4 rounded-xl font-bold text-lg transition-all shadow-lg
                  ${answers[currentQuestionIndex] 
                    ? "bg-white text-slate-900 hover:scale-[1.02] hover:shadow-xl" 
                    : "bg-slate-800 text-slate-500 cursor-not-allowed"}`}
              >
                {currentQuestionIndex === questions.length - 1 ? "Finish Assessment" : "Next Question"}
              </button>
            </div>
          </motion.div>
        )}

        {currentStep === "evaluating" && (
          <div className="text-center py-20 bg-slate-900/50 rounded-3xl border border-white/5 backdrop-blur-sm">
             <div className="relative w-24 h-24 mx-auto mb-8">
               <div className="absolute inset-0 border-4 border-slate-700 rounded-full" />
               <div className="absolute inset-0 border-4 border-blue-500 rounded-full border-t-transparent animate-spin" />
               <div className="absolute inset-0 flex items-center justify-center">
                 <svg className="w-8 h-8 text-blue-500 animate-pulse" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                 </svg>
               </div>
             </div>
             <h3 className="text-3xl font-bold mb-3 text-white">Evaluator Agent Working</h3>
             <p className="text-blue-300 text-lg">Analyzing your command over {getDomainTitle()}...</p>
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
                ${level === 'Advanced' ? 'bg-fuchsia-600' : level === 'Intermediate' ? 'bg-cyan-600' : 'bg-lime-600'}`} 
            />

            <div className="inline-block p-6 rounded-3xl bg-black/20 border border-white/10 mb-8 backdrop-blur-md shadow-xl">
               <svg className={`w-20 h-20 ${level === 'Advanced' ? 'text-fuchsia-400' : level === 'Intermediate' ? 'text-cyan-400' : 'text-lime-400'}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                 <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
               </svg>
            </div>
            
            <h2 className="text-4xl md:text-5xl font-black mb-4 text-white tracking-tight">Assessment Complete</h2>
            <p className="text-slate-400 text-lg mb-12">Here is your verified skill breakdown</p>

            <div className="bg-black/30 rounded-2xl p-8 mb-10 border border-white/5 backdrop-blur-md">
              <div className="text-xs text-slate-500 uppercase tracking-[0.3em] font-bold mb-4">You are eligible for</div>
              <div className={`text-5xl md:text-6xl font-black mb-8 tracking-tighter drop-shadow-2xl ${
                  level === 'Advanced' ? 'text-transparent bg-clip-text bg-linear-to-b from-fuchsia-300 to-fuchsia-600' : 
                  level === 'Intermediate' ? 'text-transparent bg-clip-text bg-linear-to-b from-cyan-300 to-cyan-600' : 
                   'text-transparent bg-clip-text bg-linear-to-b from-lime-300 to-lime-600'
              }`}>
                {level} Proficiency
              </div>
              
              <div className="relative w-full max-w-sm mx-auto h-4 rounded-full bg-slate-800/50 overflow-hidden mb-6">
                 <motion.div 
                    initial={{ width: 0 }}
                    animate={{ width: `${score}%` }}
                    transition={{ duration: 1.5, ease: "easeOut" }}
                    className={`h-full shadow-[0_0_20px_currentColor] ${
                      level === 'Advanced' ? 'bg-linear-to-r from-fuchsia-500 to-purple-600' : 
                      level === 'Intermediate' ? 'bg-linear-to-r from-cyan-500 to-blue-600' : 'bg-linear-to-r from-lime-500 to-green-600'
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
                  navigate("/dashboard");
                }}
                className="px-8 py-4 rounded-xl font-bold text-lg transition-all text-slate-300 hover:text-white hover:bg-white/5 border border-transparent hover:border-white/10"
              >
                Back to Dashboard
              </button>
              <button
                      onClick={() => {
                        clearAssessmentState(assessmentId);
                         const bankDomain = getQuestionBankDomain(domain);
                         const newQuestions = generateAssessment(bankDomain, 10);
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
                        Retake Assessment
                    </button>
              <button
                onClick={() => setCurrentStep("learning-plan")} 
                className="bg-white text-slate-900 px-8 py-4 rounded-xl font-bold text-lg transition-all shadow-lg hover:scale-[1.02] hover:shadow-xl hover:bg-slate-50"
              >
                Start Learning Plan
              </button>
            </div>

            <p className="text-xs text-slate-600 max-w-lg mx-auto leading-relaxed">
              *Disclaimer: This assessment is an AI-generated evaluation for educational purposes. 
              Results are indicative of your current understanding and eligible resource level, not a formal certification.
            </p>
          </motion.div>
        )}

        {currentStep === "learning-plan" && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-slate-900/50 backdrop-blur-sm border border-white/10 p-10 rounded-3xl shadow-2xl text-center max-w-4xl mx-auto"
          >
             <h2 className="text-4xl font-bold mb-4 text-white">Your Personalized Path</h2>
             <p className="text-slate-300 text-lg mb-10">
               Based on your <span className={`font-bold ${
                  level === 'Advanced' ? 'text-fuchsia-400' : 
                  level === 'Intermediate' ? 'text-cyan-400' : 'text-lime-400'
               }`}>{level}</span> proficiency, we recommend starting with these resources.
             </p>

             {(() => {
                const learningResources = {
                  dsa: {
                    Beginner: {
                        logo: "https://upload.wikimedia.org/wikipedia/commons/thumb/a/a0/W3Schools_logo.svg/512px-W3Schools_logo.svg.png",
                        title: "W3Schools DSA",
                        description: "Simple, interactive examples for beginners.",
                        link: "https://www.w3schools.com/dsa/",
                        video: "https://www.youtube.com/embed/8hly31xKli0"
                    },
                    Intermediate: {
                        logo: "https://upload.wikimedia.org/wikipedia/commons/9/97/Coursera-Logo_600x600.svg",
                        title: "Coursera Algorithms",
                        description: "Deep dive with university-level courses.",
                        link: "https://www.coursera.org/specializations/algorithms",
                        video: "https://www.youtube.com/embed/zHxt7Ta3914"
                    },
                    Advanced: {
                        logo: "https://upload.wikimedia.org/wikipedia/commons/4/43/GeeksforGeeks.svg",
                        title: "GeeksforGeeks Advanced",
                        description: "Comprehensive articles and complex problems.",
                        link: "https://www.geeksforgeeks.org/data-structures/",
                        video: "https://www.youtube.com/embed/5_5oE5lGRFc"
                    }
                  },
                  programming: {
                    Beginner: {
                        logo: "https://upload.wikimedia.org/wikipedia/commons/thumb/a/a0/W3Schools_logo.svg/512px-W3Schools_logo.svg.png",
                        title: "W3Schools Programming",
                        description: "Learn Python, Java, C++ syntax easily.",
                        link: "https://www.w3schools.com/",
                        video: "https://www.youtube.com/embed/kqtD5dpn9C8" // Python example
                    },
                    Intermediate: {
                        logo: "https://upload.wikimedia.org/wikipedia/commons/9/97/Coursera-Logo_600x600.svg",
                        title: "Coursera Programming",
                        description: "Python for Everybody or Java Programming.",
                        link: "https://www.coursera.org/specializations/python",
                        video: "https://www.youtube.com/embed/8DvywoWv6fI" // Python for everybody
                    },
                    Advanced: {
                        logo: "https://upload.wikimedia.org/wikipedia/commons/4/43/GeeksforGeeks.svg",
                        title: "GeeksforGeeks System Design",
                        description: "Low level design and language internals.",
                        link: "https://www.geeksforgeeks.org/computer-science-projects/",
                        video: "https://www.youtube.com/embed/SLLnJ1eb5QU" // System design
                    }
                  },
                  ml: {
                    Beginner: {
                        logo: "https://upload.wikimedia.org/wikipedia/commons/thumb/a/a0/W3Schools_logo.svg/512px-W3Schools_logo.svg.png",
                        title: "W3Schools AI/ML",
                        description: " Intro to AI and Machine Learning concepts.",
                        link: "https://www.w3schools.com/ai/",
                        video: "https://www.youtube.com/embed/JMUxmLyrhSk" // ML intro
                    },
                    Intermediate: {
                        logo: "https://upload.wikimedia.org/wikipedia/commons/9/97/Coursera-Logo_600x600.svg",
                        title: "Coursera Machine Learning",
                        description: "The famous Andrew Ng Machine Learning course.",
                        link: "https://www.coursera.org/specializations/machine-learning-introduction",
                        video: "https://www.youtube.com/embed/PPLop4L2eGk" // Andrew Ng
                    },
                    Advanced: {
                        logo: "https://upload.wikimedia.org/wikipedia/commons/4/43/GeeksforGeeks.svg",
                        title: "GeeksforGeeks ML",
                        description: "Advanced algorithms and deep learning logic.",
                        link: "https://www.geeksforgeeks.org/machine-learning/",
                        video: "https://www.youtube.com/embed/aircAruvnKk" // 3blue1brown neural networks
                    }
                  },
                  serviceBased: {
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
                  }
                };

                let domainResources = learningResources[domain] || learningResources.dsa;
                let resourceKey = level;

                // specialized logic for serviceBased mapping
                if (domain === 'serviceBased') {
                    if (level === 'Beginner') resourceKey = 'Foundation';
                    else if (level === 'Intermediate') resourceKey = 'Professional';
                    else if (level === 'Advanced') resourceKey = 'Elite';
                }

                const resource = domainResources[resourceKey] || domainResources.Beginner || domainResources.Foundation;

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
                     
                     {domain === 'serviceBased' && (
                        <div className="mb-4 w-full bg-slate-100 p-3 rounded-xl border border-slate-200">
                             <div className="flex justify-between text-xs text-slate-500 font-bold uppercase tracking-wide mb-1">
                                <span>Readiness Tier</span>
                                <span className="text-blue-600">{resource.readinessTier}</span>
                             </div>
                             <div className="flex justify-between text-xs text-slate-500 font-bold uppercase tracking-wide">
                                <span>Simulation Code</span>
                                <span className="text-emerald-600">{resource.simulationType}</span>
                             </div>
                        </div>
                     )}

                     <p className="text-slate-600 mb-6 text-sm leading-relaxed">
                       {resource.description}
                     </p>
                     <a 
                       href={resource.link} 
                       target="_blank" 
                       rel="noopener noreferrer"
                       className="w-full block text-white font-bold py-3 rounded-xl transition-colors bg-blue-600 hover:bg-blue-700"
                     >
                       Start Free Course
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
                


                <div className="flex gap-4">
                    <button
                      onClick={() => {
                        clearAssessmentState(assessmentId);
                        navigate("/dashboard");
                      }}
                       className="px-8 py-3 rounded-xl font-bold text-sm uppercase tracking-widest transition-all text-slate-400 hover:text-white hover:bg-white/5 border border-transparent hover:border-white/10"
                    >
                      Skip to Dashboard
                    </button>
                    <button
                      onClick={() => {
                        clearAssessmentState(assessmentId);
                        // No direct "Select Other" logic here, defaulting to dashboard for now or back
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

export default Assessment;
