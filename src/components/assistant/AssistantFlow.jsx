import { useState, useEffect, useRef } from "react";
import { supabase } from "../../lib/supabase";
import { useAuth } from "../../context/AuthContext";

// Import Agents (Pure Functions)
import { getQuestion } from "../../agents/TeacherAgent";
import { evaluateAnswer } from "../../agents/EvaluatorAgent";
import { analyzeGap } from "../../agents/KnowledgeGapAnalyzer";
import { determineStrategy } from "../../agents/StrategyAgent";

const initialFlow = [
  {
    id: "direction",
    question: "What direction are you leaning toward?",
    options: ["Software / Coding", "Core Engineering", "Management / Consulting", "Not sure yet"]
  },
  {
    id: "goal",
    question: "What is your current objective?",
    options: ["Strengthen fundamentals", "Prepare for interviews", "Improve problem solving", "Academic preparation", "Exploring options"]
  },
  {
    id: "timeline",
    question: "Are you preparing for something specific soon?",
    options: ["Placement season", "Semester exams", "Competitive exam", "No fixed deadline"]
  }
];

const AssistantFlow = () => {
  const { user } = useAuth();
  const chatEndRef = useRef(null);

  // --- STATE ---
  const [mode, setMode] = useState("onboarding"); // 'onboarding' | 'learning'
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  
  // Onboarding State
  const [onboardingStep, setOnboardingStep] = useState(0);

  // Learning State (Centralized)
  const [currentQuestion, setCurrentQuestion] = useState(null);
  const [learnerState, setLearnerState] = useState({ mastery: {} });
  const [consecutiveIncorrect, setConsecutiveIncorrect] = useState(0);
  const [consecutiveCorrect, setConsecutiveCorrect] = useState(0);
  const [questionCount, setQuestionCount] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState(null);
  const [evaluationResult, setEvaluationResult] = useState(null);
  const [fadeOpacity, setFadeOpacity] = useState(1);
  
  // Interaction & History
  const [isProcessing, setIsProcessing] = useState(false);
  const [isAnswerLocked, setIsAnswerLocked] = useState(false);
  const [isAssessmentComplete, setIsAssessmentComplete] = useState(false);
  const [correctCount, setCorrectCount] = useState(0);
  const [history, setHistory] = useState([]);

  // --- ACTIONS ---

  const restartAssessment = () => {
    setMessages([{ role: "assistant", text: initialFlow[0].question }]);
    setMode("learning"); 
    setQuestionCount(0);
    setConsecutiveIncorrect(0);
    setConsecutiveCorrect(0);
    setCorrectCount(0);
    setLearnerState({ mastery: {} }); 
    setHistory([]); // Clear history
    setIsAssessmentComplete(false);
    setIsAnswerLocked(false);
    setSelectedAnswer(null);
    setEvaluationResult(null);
    setFadeOpacity(1);
    
    setMessages([{ role: "assistant", text: "Starting a new session! Let's go." }]);
    
    // Clear any existing timeouts or async ops by using a fresh cycle
    setTimeout(() => {
        if (isMounted.current) startLearning();
    }, 1000);
  };

  const saveCheckpoint = () => {
    const checkpoint = {
        messages: [...messages],
        learnerState: JSON.parse(JSON.stringify(learnerState)),
        consecutiveIncorrect,
        consecutiveCorrect,
        questionCount,
        correctCount,
        currentQuestion,
        selectedAnswer,
        evaluationResult
    };
    setHistory(prev => [...prev, checkpoint]);
  };

  const handleUndo = () => {
    if (history.length === 0) return;

    const previousState = history[history.length - 1];
    setHistory(prev => prev.slice(0, -1));

    // Restore State
    setMessages(previousState.messages);
    setLearnerState(previousState.learnerState);
    setConsecutiveIncorrect(previousState.consecutiveIncorrect);
    setConsecutiveCorrect(previousState.consecutiveCorrect || 0);
    setQuestionCount(previousState.questionCount);
    setCorrectCount(previousState.correctCount);
    setCurrentQuestion(previousState.currentQuestion);
    setIsAssessmentComplete(false); // Just in case
    setIsAnswerLocked(false); // Unlock on undo
    setSelectedAnswer(previousState.selectedAnswer || null);
    setEvaluationResult(previousState.evaluationResult || null);
    setFadeOpacity(1);
  };

  // --- EFFECTS ---

  const isMounted = useRef(true);

  useEffect(() => {
    isMounted.current = true;
    return () => { isMounted.current = false; };
  }, []);

  // Initial Greeting
  useEffect(() => {
    setMessages([
      { role: "assistant", text: "Hi 👋 I’ll personalize your learning journey." },
      { role: "assistant", text: initialFlow[0].question }
    ]);
  }, []);

  // Auto-scroll
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isProcessing]);


  // --- HANDLERS ---

  // --- HANDLERS ---

  const handleInput = async (value) => {
    // Immediate Guard: Prevent processing if locked or empty
    if (!value.trim() || isProcessing || isAnswerLocked) return;

    // 1. Add User Message
    const userMsg = { role: "user", text: value };
    setMessages(prev => [...prev, userMsg]);
    setInput("");
    setIsProcessing(true);
    setIsAnswerLocked(true); // Lock immediately for learning mode

    // 2. Delegate based on Mode
    if (mode === "onboarding") {
      await processOnboarding(value);
    } else {
      setSelectedAnswer(value); // Track selected answer
      saveCheckpoint(); // Save state before processing new answer
      await processLearningLoop(value);
    }

    if (isMounted.current) setIsProcessing(false);
  };

  // --- ONBOARDING LOGIC ---

  const processOnboarding = async (answer) => {
    // Simulate thinking delay
    await new Promise(r => setTimeout(r, 500));

    const nextStep = onboardingStep + 1;

    if (nextStep < initialFlow.length) {
      setOnboardingStep(nextStep);
      setMessages(prev => [...prev, { role: "assistant", text: initialFlow[nextStep].question }]);
    } else {
      // Save Profile
      if (user) {
        await supabase.from("profiles").update({ interests_completed: true }).eq("id", user.id);
      }

      setMessages(prev => [
        ...prev, 
        { role: "assistant", text: "Profile setup complete! Switching to learning mode..." }
      ]);
      
      setMode("learning");
      
      // Start Learning Chain
      setTimeout(() => startLearning(), 1000);
    }
  };

  // --- LEARNING LOOP LOGIC ---

  // --- LEARNING LOOP LOGIC ---

  const startLearning = () => {
    // Session Initialization Phase
    setMessages(prev => [
        ...prev, 
        { role: "assistant", text: "Today we will assess your understanding of Data Structures & Algorithms with 10 adaptive questions." },
        { role: "assistant", text: "I'll adjust the difficulty based on your responses to find your true level. Let's begin!" }
    ]);

    // Initial Question (Diagnostic Phase - Start Medium)
    setTimeout(() => {
        if (!isMounted.current) return;
        const question = getQuestion('dsa_hard', 'medium');
        
        if (question) {
            presentQuestion(question, 0.5); // Default start mastery
        } else {
             setMessages(prev => [...prev, { role: "assistant", text: "Error: Could not retrieve initial question." }]);
        }
    }, 2000);
  };

  const processLearningLoop = async (userAnswer) => {
    if (!currentQuestion || !isMounted.current) return;

    await new Promise(r => setTimeout(r, 600)); // Realism delay
    if (!isMounted.current) return;

    // 1. Evaluator Agent
    const evaluation = evaluateAnswer(userAnswer, currentQuestion.correctAnswer);
    
    // Batch Update 1: Feedback & Evaluation
    setEvaluationResult(evaluation); 
    setMessages(prev => [...prev, { role: "assistant", text: evaluation.feedback }]);

    // Determine correctness state
    const isCorrect = evaluation.isCorrect;
    
    // Batch Update 2: Stats & Progress
    if (isCorrect) {
      setCorrectCount(prev => prev + 1);
      setConsecutiveCorrect(prev => prev + 1);
      setConsecutiveIncorrect(0);
    } else {
      setConsecutiveCorrect(0);
      setConsecutiveIncorrect(prev => prev + 1);
    }

    // 2. Update Learner State
    const conceptId = currentQuestion.conceptId;
    const currentMastery = learnerState.mastery[conceptId] || 0.5;
    const accuracy = isCorrect ? 1 : 0;
    
    let newMastery = (0.7 * currentMastery) + (0.3 * accuracy);
    newMastery = Math.max(0, Math.min(1, newMastery)); // Cap 0-1

    setLearnerState(prev => ({
      mastery: { ...prev.mastery, [conceptId]: newMastery }
    }));

    // 3. Check for Completion BEFORE proceeding
    // If we just answered the 10th question, stop.
    if (questionCount >= 10) {
        setMessages(prev => [...prev, { role: "assistant", text: "Let's review how you performed." }]);
        setTimeout(() => {
            if (isMounted.current) setIsAssessmentComplete(true);
        }, 1500);
        return;
    }

    // 4. Strategy & Next Step
    const newConsecutiveInc = isCorrect ? 0 : consecutiveIncorrect + 1;
    let strategy = determineStrategy(newMastery, evaluation.errorType, newConsecutiveInc);

    // Diagnostic Phase Override (First 2 Questions)
    if (questionCount < 2) {
        strategy = { action: "maintain", priority: "high" }; 
    }

    // 5. Execute Next Step with Safety
    setTimeout(() => {
        if (!isMounted.current) return;
        executeStrategy(strategy, conceptId, currentQuestion.difficulty, newMastery, currentQuestion);
    }, 1500);
  };

  const executeStrategy = (strategy, conceptId, currentDifficulty, currentMastery, questionContext = null) => {
    let nextDifficulty = currentDifficulty;

    // 1. Handle Strategy Actions
    if (strategy.action === "explanation") {
        // Prevent infinite loop if already explained
        if (questionContext && questionContext.explained) {
             nextDifficulty = currentDifficulty; // Fallback to normal flow
        } else {
            // Show Explanation & Reinforce
            setTimeout(() => {
                if (!isMounted.current) return;
                setMessages(prev => [...prev, { 
                    role: "assistant", 
                    text: questionContext?.explanation || "Let me break this down. Understanding the core logic is key." 
                }]);

                setTimeout(() => {
                     if (!isMounted.current) return;
                     setMessages(prev => [...prev, { 
                        role: "assistant", 
                        text: "Now, let's try a reinforcement question to make sure you've got it." 
                    }]);
                    
                    // REINFORCEMENT: Same Difficulty
                    const nextQuestion = getQuestion(conceptId, currentDifficulty);
                    if (nextQuestion) presentQuestion(nextQuestion, currentMastery);

                }, 3000); // Read time
            }, 1000); 
            return; 
        }
    } 
    
    if (strategy.action === "hint") {
        setMessages(prev => [...prev, { role: "assistant", text: "Here is a hint: Check edge cases or consider a different data structure." }]);
        // Keep same difficulty
        nextDifficulty = currentDifficulty;
    }

    if (strategy.action === "increase_difficulty") {
        // Progressive Increase
        if (currentDifficulty === 'easy') nextDifficulty = 'medium';
        else if (currentDifficulty === 'medium') nextDifficulty = 'hard';
        else nextDifficulty = 'hard'; // Cap at hard

        setMessages(prev => [...prev, { role: "assistant", text: "You're doing great! Increasing difficulty." }]);
    }
    
    // Default / Maintain / Fallback
    const nextQuestion = getQuestion(conceptId, nextDifficulty);
    
    if (nextQuestion) {
       presentQuestion(nextQuestion, currentMastery);
    } else {
       // Graceful exit if no question found
       setMessages(prev => [...prev, { role: "assistant", text: "Session Complete. Great job!" }]);
    }
  };

  const presentQuestion = (question, mastery) => {
    // 1. Fade Out
    setFadeOpacity(0);

    // 2. Wait for fade out, then update state
    setTimeout(() => {
        setIsAnswerLocked(false); // Unlock for new question
        setSelectedAnswer(null); // Reset highlighted answer
        setEvaluationResult(null); // Reset evaluation
        setCurrentQuestion(question);
        setQuestionCount(prev => prev + 1);
        setMessages(prev => [...prev, { 
            role: "assistant", 
            text: question.questionText,
            difficulty: question.difficulty, 
            learnerCtx: {
                mastery: mastery,
                level: getLearningLevel(mastery),
                isWeak: mastery < 0.4
            }
        }]);

        // 3. Fade In
        setFadeOpacity(1);
    }, 300);
  };

  const getLearningLevel = (mastery) => {
      if (mastery < 0.4) return "Beginner";
      if (mastery < 0.75) return "Intermediate";
      return "Advanced";
  };

  const getStrategyMessage = (action, difficulty) => {
    switch (action) {
      case "explanation":
        return "It looks like this concept needs reinforcement. Let me explain it clearly before we move ahead.";
      case "increase_difficulty":
        return "Great job! Let’s try a slightly more challenging question.";
      case "hint":
        return "You're close. Here's a hint to guide you.";
      case "maintain":
      default:
        return null; // No specific message for standard flow
    }
  };

  const addSystemMessage = (text) => {
    // Deprecated: No-op to prevent errors during refactor if called
  };

  // --- RENDER HELPERS ---

  // Determine current options to show
  const getCurrentOptions = () => {
    if (mode === "onboarding") {
      return initialFlow[onboardingStep].options;
    } 
    if (mode === "learning" && currentQuestion?.options) {
      return currentQuestion.options;
    }
    return [];
  };

  const currentOptions = getCurrentOptions();

  if (!currentQuestion && mode === "learning" && !isAssessmentComplete) {
      return (
          <div className="flex items-center justify-center h-full text-slate-400">
              <div className="flex flex-col items-center gap-2">
                  <div className="w-6 h-6 border-2 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
                  <span>Loading AI Tutor...</span>
              </div>
          </div>
      );
  }

  return (
    <div className="flex h-full gap-4 w-full">
      {/* Main Chat Area */}
      <div className="flex-1 flex flex-col h-full bg-slate-900/50 rounded-2xl border border-white/5 overflow-hidden">
      
        {/* Messages Area */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4 scroll-smooth">
          {messages.map((msg, i) => (
            <div
              key={i}
              className={`max-w-[85%] px-4 py-3 rounded-2xl text-sm leading-relaxed ${
                msg.role === "assistant"
                  ? "bg-white/10 text-slate-200 self-start rounded-tl-sm"
                  : "bg-blue-600 text-white self-end ml-auto rounded-tr-sm"
              }`}
            >
              <div className="flex flex-col gap-1">
                  <div className="flex justify-between items-start gap-2">
                      <span>{msg.text}</span>
                      {msg.role === "assistant" && msg.difficulty && (
                          <span className={`text-[10px] px-2 py-0.5 rounded-full border font-semibold tracking-wide uppercase shrink-0 ${
                              msg.difficulty === 'easy' ? "bg-green-500/10 text-green-400 border-green-500/20" :
                              msg.difficulty === 'hard' ? "bg-purple-500/10 text-purple-400 border-purple-500/20" :
                              "bg-blue-500/10 text-blue-400 border-blue-500/20"
                          }`}>
                              {msg.difficulty || 'Medium'}
                          </span>
                      )}
                  </div>
              </div>
              {msg.role === "assistant" && msg.learnerCtx && !isAssessmentComplete && (
                 <div className="mt-3 pt-3 border-t border-white/10 flex flex-wrap gap-3 text-xs font-mono text-slate-400">
                    <span className={msg.learnerCtx.isWeak ? "text-yellow-400 font-bold" : ""}>
                      Mastery: {msg.learnerCtx.mastery.toFixed(2)}
                    </span>
                    <span className="text-slate-500">|</span>
                    <span className={
                        (msg.learnerCtx?.level || "Beginner") === "Beginner" ? "text-blue-400" :
                        (msg.learnerCtx?.level || "Beginner") === "Intermediate" ? "text-cyan-400" : "text-green-400"
                    }>
                      {msg.learnerCtx?.level}
                    </span>
                    
                    {/* Streak is technically global state, but if we want to snapshot it we should have added it to ctx too. 
                        For now, using global state is fine as it's less critical to debug than mastery history. 
                        Actually, better to use current state for streak to show CURRENT streak. */}
                    {consecutiveIncorrect > 0 && currentQuestion && msg.text === currentQuestion.questionText && (
                        <>
                          <span className="text-slate-500">|</span>
                          <span className="text-red-400">Incorrect Streak: {consecutiveIncorrect}</span>
                        </>
                    )}

                    {/* Visual Mastery Progress Bar */}
                    <div className="w-full h-1.5 bg-slate-800 rounded-full mt-2 overflow-hidden">
                      <div 
                          className={`h-full transition-all duration-500 ease-out rounded-full ${
                               msg.learnerCtx.mastery < 0.4 ? "bg-red-500" :
                               msg.learnerCtx.mastery < 0.75 ? "bg-yellow-500" : "bg-green-500"
                          }`}
                          style={{ width: `${Math.max(5, msg.learnerCtx.mastery * 100)}%` }}
                      />
                    </div>
                    
                    {/* Learning Streak Indicator */}
                    {consecutiveCorrect >= 2 && currentQuestion && msg.text === currentQuestion.questionText && (
                        <div className="w-full text-orange-400 text-xs font-semibold mt-1 animate-in fade-in slide-in-from-left-2 duration-500">
                            🔥 Learning Streak: {consecutiveCorrect} Correct in a Row
                        </div>
                    )}

                    {msg.learnerCtx.isWeak && (
                        <div className="w-full text-yellow-500/80 italic mt-1">
                            ⚠ Weak Concept detected. Adjusting pace...
                        </div>
                    )}
                 </div>
              )}
            </div>
          ))}
          
          {isAssessmentComplete && currentQuestion && (
              <div className="w-full bg-slate-800/80 p-6 rounded-2xl border border-white/10 animate-in fade-in slide-in-from-bottom-4 duration-500">
                  <h3 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
                      🎓 Assessment Complete
                  </h3>
                  
                  <div className="grid grid-cols-2 gap-4 mb-6">
                      <div className="bg-white/5 p-3 rounded-lg">
                          <div className="text-slate-400 text-xs uppercase tracking-wider mb-1">Final Mastery</div>
                          <div className="text-2xl font-bold text-blue-400">
                              {(learnerState.mastery?.[currentQuestion?.conceptId] || 0.5).toFixed(2)}
                          </div>
                      </div>
                       <div className="bg-white/5 p-3 rounded-lg">
                          <div className="text-slate-400 text-xs uppercase tracking-wider mb-1">Level</div>
                          <div className={`text-2xl font-bold ${
                               getLearningLevel(learnerState.mastery?.[currentQuestion?.conceptId] || 0.5) === "Beginner" ? "text-blue-400" :
                               getLearningLevel(learnerState.mastery?.[currentQuestion?.conceptId] || 0.5) === "Intermediate" ? "text-cyan-400" : "text-green-400"
                          }`}>
                              {getLearningLevel(learnerState.mastery?.[currentQuestion?.conceptId] || 0.5)}
                          </div>
                      </div>
                      <div className="bg-white/5 p-3 rounded-lg">
                          <div className="text-slate-400 text-xs uppercase tracking-wider mb-1">Accuracy</div>
                          <div className="text-xl font-bold text-white">
                              {Math.round((correctCount / 10) * 100)}%
                          </div>
                      </div>
                       <div className="bg-white/5 p-3 rounded-lg">
                          <div className="text-slate-400 text-xs uppercase tracking-wider mb-1">Questions</div>
                          <div className="text-xl font-bold text-white">
                              {questionCount}
                          </div>
                      </div>
                  </div>

                  <div className="mb-6 p-4 bg-blue-500/10 rounded-xl border border-blue-500/20">
                      <p className="text-blue-200 text-sm italic">
                          {(learnerState.mastery[currentQuestion.conceptId] || 0.5) < 0.4 
                              ? "Recommendation: Your mastery is developing. We recommend strengthening your fundamentals with core concept revision." 
                              : (learnerState.mastery[currentQuestion.conceptId] || 0.5) <= 0.75
                                  ? "Recommendation: Good foundation. We recommend more practice problems to reach advanced proficiency."
                                  : "Recommendation: Excellent work! You are ready for advanced content and complex challenges."
                          }
                      </p>
                  </div>

                  <button 
                      onClick={restartAssessment}
                      className="w-full py-3 bg-blue-600 hover:bg-blue-500 text-white rounded-xl font-bold transition-all shadow-lg hover:shadow-blue-500/25"
                  >
                      Retake Assessment
                  </button>
              </div>
          )}

           {isProcessing && !isAssessmentComplete && (
              <div className="flex gap-1 px-4 py-2">
                <div className="w-2 h-2 bg-slate-500 rounded-full animate-bounce" style={{ animationDelay: '0s' }}/>
                <div className="w-2 h-2 bg-slate-500 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}/>
                <div className="w-2 h-2 bg-slate-500 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}/>
              </div>
            )}
          <div ref={chatEndRef} />
        </div>

        {/* Inputs Area */}
        {!isAssessmentComplete && (
        <div className="mt-auto p-4 bg-slate-950 border-t border-white/10 shrink-0">
          
          {/* Option Buttons */}
          {currentOptions.length > 0 && !isProcessing && (
            <div className={`flex flex-wrap gap-2 mb-3 transition-opacity duration-300 ease-in-out ${fadeOpacity === 1 ? 'opacity-100' : 'opacity-0'}`}>
              {currentOptions.map((opt, idx) => {
                 // Determine style based on interaction state
                 let btnClass = "bg-slate-800 hover:bg-slate-700 text-slate-300 border-white/5";
                 
                 if (evaluationResult) {
                     if (opt === currentQuestion?.correctAnswer) {
                         btnClass = "bg-green-500/20 border-green-500/40 text-green-400";
                     } else if (opt === selectedAnswer && opt !== currentQuestion?.correctAnswer) {
                         btnClass = "bg-red-500/20 border-red-500/40 text-red-400";
                     } else {
                         btnClass = "opacity-50 text-slate-500 border-transparent";
                     }
                 }
                 
                 return (
                    <button
                      key={idx}
                      onClick={() => handleInput(opt)}
                      disabled={isAnswerLocked}
                      className={`px-3 py-2 text-xs rounded-lg border transition-colors disabled:cursor-not-allowed ${btnClass}`}
                    >
                      {opt}
                    </button>
                 );
              })}
            </div>
          )}
          
          {/* Text Input */}
          <div className="flex gap-2">
            <input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleInput(input)}
              placeholder="Type your answer..."
              disabled={isProcessing}
              className="flex-1 bg-slate-900 border border-white/10 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all disabled:opacity-50"
            />
            <button
              onClick={() => handleInput(input)}
              disabled={!input.trim() || isProcessing}
              className="bg-blue-600 hover:bg-blue-500 text-white px-5 rounded-xl font-medium text-sm transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Send
            </button>
            
            {history.length > 0 && !isProcessing && (
                <button
                  onClick={handleUndo}
                  className="bg-slate-800 hover:bg-slate-700 text-slate-400 px-4 rounded-xl font-medium text-sm transition-colors border border-white/5"
                  title="Undo last answer"
                >
                  ⟲
                </button>
            )}
          </div>
        </div>
        )}
      </div>

      {/* Mastery Dashboard Panel (Side Panel) */}
      <div className="hidden md:flex w-72 flex-col bg-slate-900/50 rounded-2xl border border-white/5 overflow-hidden">
         <div className="p-4 border-b border-white/5 bg-white/5">
             <h3 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
                 <svg className="w-4 h-4 text-blue-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                     <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                 </svg>
                 Concept Mastery
             </h3>
         </div>
         <div className="p-4 overflow-y-auto flex-1 space-y-4">
             {Object.keys(learnerState.mastery).length === 0 ? (
                 <div className="text-slate-500 text-xs text-center py-8 italic">
                     No concept data yet.<br/>Start learning to see progress!
                 </div>
             ) : (
                 Object.entries(learnerState.mastery).map(([concept, mastery]) => (
                     <div key={concept} className="group">
                         <div className="flex justify-between items-end mb-1">
                             <span className="text-xs font-medium text-slate-300 capitalize truncate max-w-[70%]">{concept.replace('_', ' ')}</span>
                             <span className={`text-xs font-mono font-bold ${
                                 mastery < 0.4 ? "text-red-400" :
                                 mastery < 0.75 ? "text-yellow-400" : "text-green-400"
                             }`}>
                                 {mastery.toFixed(2)}
                             </span>
                         </div>
                         <div className="w-full h-2 bg-slate-800 rounded-full overflow-hidden border border-white/5">
                             <div 
                                 className={`h-full transition-all duration-700 ease-out rounded-full ${
                                      mastery < 0.4 ? "bg-red-500" :
                                      mastery < 0.75 ? "bg-yellow-500" : "bg-green-500"
                                 }`}
                                 style={{ width: `${Math.max(5, mastery * 100)}%` }}
                             />
                         </div>
                     </div>
                 ))
             )}
         </div>
         {/* Session Stats Mini-Card */}
         <div className="p-4 bg-black/20 text-xs text-slate-400 border-t border-white/5 grid grid-cols-2 gap-2">
             <div className="text-center p-2 rounded bg-white/5">
                 <div className="text-slate-500 text-[10px] uppercase">Streak</div>
                 <div className="text-lg font-bold text-white">{consecutiveCorrect} 🔥</div>
             </div>
             <div className="text-center p-2 rounded bg-white/5">
                 <div className="text-slate-500 text-[10px] uppercase">Correct</div>
                 <div className="text-lg font-bold text-white">{correctCount}/{questionCount}</div>
             </div>
         </div>
      </div>
    </div>
  );
};

export default AssistantFlow;
