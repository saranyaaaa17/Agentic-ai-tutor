import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { oneDark } from 'react-syntax-highlighter/dist/esm/styles/prism';
import Mermaid from './Mermaid';
import { useAuth } from "../../context/AuthContext";
import { useSettings } from "../../context/SettingsContext";

// Reusable code block with copy button
const CodeBlock = ({ language, children }) => {
    const [copied, setCopied] = useState(false);
    const code = String(children).replace(/\n$/, '');
    const copy = () => {
        navigator.clipboard.writeText(code);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };
    return (
        <div className="relative my-3 rounded-xl overflow-hidden border border-white/10 bg-[#1a1f2e]">
            <div className="flex items-center justify-between px-4 py-2 bg-white/5 border-b border-white/10">
                <span className="text-[10px] font-bold uppercase tracking-widest text-slate-500">{language || 'code'}</span>
                <button
                    onClick={copy}
                    style={{ color: copied ? 'var(--accent-primary)' : 'inherit' }}
                    className="text-[10px] text-slate-500 hover:text-(--accent-primary) transition-colors flex items-center gap-1.5 font-medium"
                >
                    {copied ? (
                        <><svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" /></svg>Copied!</>
                    ) : (
                        <><svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" /></svg>Copy</>
                    )}
                </button>
            </div>
            <SyntaxHighlighter
                language={language || 'text'}
                style={oneDark}
                customStyle={{ margin: 0, background: 'transparent', padding: '16px', fontSize: '12.5px', lineHeight: '1.6' }}
                showLineNumbers={code.split('\n').length > 4}
                lineNumberStyle={{ color: '#334155', fontSize: '11px', minWidth: '2.5em' }}
            >
                {code}
            </SyntaxHighlighter>
        </div>
    );
};

const Socratic = () => {
    const { user } = useAuth();
    const { socraticMode, setSocraticMode, spokenLanguage } = useSettings();
    const STORAGE_KEY = `helper_bot_v13_${user?.id || 'guest'}`;
    
    const [isOpen, setIsOpen] = useState(false);
    const [isExpanded, setIsExpanded] = useState(false);
    const [complexity, setComplexity] = useState(3);
    const [thinkingSteps, setThinkingSteps] = useState([]);
    const [isListening, setIsListening] = useState(false);
    const [showSettings, setShowSettings] = useState(false);
    const [editingMsgId, setEditingMsgId] = useState(null);
    const [editValue, setEditValue] = useState("");
    const [autoResetOnClose, setAutoResetOnClose] = useState(true);
    const [showWelcome, setShowWelcome] = useState(false);
    const [aiAnalysis, setAiAnalysis] = useState({ weak: "Recursion", strong: "Arrays", confidence: 72 });
    
    // Interview Mode State
    const [isInterviewMode, setIsInterviewMode] = useState(false);
    const [interviewTimeLeft, setInterviewTimeLeft] = useState(0);

    const formatTimer = (seconds) => {
        const m = Math.floor(seconds / 60);
        const s = seconds % 60;
        return `${m}:${s < 10 ? '0' : ''}${s}`;
    };

    useEffect(() => {
        const timer = setTimeout(() => {
            if (!isOpen) setShowWelcome(true);
        }, 3000);
        return () => clearTimeout(timer);
    }, [isOpen]);
    
    const [sessions, setSessions] = useState(() => {
        const saved = localStorage.getItem(STORAGE_KEY);
        const defaultId = Date.now().toString();
        const defaultSession = {
            id: defaultId,
            title: "Welcome to Socratic",
            messages: [{ 
                role: "assistant", 
                id: 'm1',
                content: "# Hello! I'm Socratic 👋\nWelcome to your personalized study terminal. I've been equipped with advanced knowledge in **Interview Prep**, **DSA**, and **System Design** to help you succeed.\n\nWhether you're preparing for a big interview or mastering a new complex topic, I'm here to guide you step-by-step.\n\n### How can we start today?\n- **DSA Practice**\n- **Mock Interview**\n- **Complex Concept Breakdown**\n\n> **Pro Tip**: Adjust the **Complexity Slider** in settings to match your current proficiency!" 
            }]
        };
        return saved ? JSON.parse(saved) : [defaultSession];
    });
    
    const [activeSessionId, setActiveSessionId] = useState(() => sessions[0]?.id);
    const activeSession = sessions.find(s => s.id === activeSessionId) || sessions[0];
    const messages = activeSession?.messages || [];

    const [input, setInput] = useState("");
    const [isLoading, setIsLoading] = useState(false);
    const scrollRef = useRef(null);
    const fileInputRef = useRef(null);
    const cameraInputRef = useRef(null);
    const quickActions = [
        {
            label: "Explain Simply",
            prompt: "Can you explain this concept more simply?",
            className: "hover:bg-cyan-500/10 hover:border-cyan-500/50 hover:text-cyan-400"
        },
        {
            label: "Give Hint",
            prompt: "Can you give me a subtle hint without revealing the solution?",
            className: "hover:bg-amber-500/10 hover:border-amber-500/50 hover:text-amber-400"
        },
        {
            label: "Harder Question",
            prompt: "This feels a bit easy for me. Can you give me a harder question or edge case?",
            className: "hover:bg-rose-500/10 hover:border-rose-500/50 hover:text-rose-400"
        },
        {
            label: "Generate Diagram",
            prompt: "Can you generate a flowchart or diagram to visualize this concept? Please use mermaid.",
            className: "hover:bg-emerald-500/10 hover:border-emerald-500/50 hover:text-emerald-400"
        },
        {
            label: "Code Snippet",
            prompt: "Can you provide a small, clean code snippet demonstrating this implementation?",
            className: "hover:bg-indigo-500/10 hover:border-indigo-500/50 hover:text-indigo-400"
        }
    ];

    useEffect(() => {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(sessions));
    }, [sessions, STORAGE_KEY]);

    useEffect(() => {
        if (scrollRef.current) {
            scrollRef.current.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
        }
    }, [messages, isLoading, thinkingSteps]);

    useEffect(() => {
        const handleExternalAsk = (e) => {
            const { text } = e.detail;
            setIsOpen(true);
            setInput(prev => prev ? `${prev}\n\nCan you explain this specific code snippet?\n\`\`\`\n${text}\n\`\`\`` : `Can you explain this code snippet?\n\`\`\`\n${text}\n\`\`\``);
        };
        window.addEventListener('askSocratic', handleExternalAsk);
        return () => window.removeEventListener('askSocratic', handleExternalAsk);
    }, []);

    const startVoiceTyping = () => {
        const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
        if (!SpeechRecognition) return alert("Speech recognition not supported");
        const recognition = new SpeechRecognition();
        recognition.onstart = () => setIsListening(true);
        recognition.onend = () => setIsListening(false);
        recognition.onresult = (event) => setInput(prev => prev + " " + event.results[0][0].transcript);
        recognition.start();
    };

    const speakMessage = (text) => {
        if (window.speechSynthesis.speaking) {
            window.speechSynthesis.cancel();
            return;
        }
        const utterance = new SpeechSynthesisUtterance(text.replace(/[#*`]/g, ''));
        utterance.rate = 1.0;
        window.speechSynthesis.speak(utterance);
    };

    const startEditing = (msg, idx) => {
        if (msg.role === 'user') { setEditingMsgId(idx); setEditValue(msg.content); }
    };

    const saveEdit = (idx) => {
        const updatedMessages = [...messages];
        updatedMessages[idx].content = editValue;
        const finalMessages = updatedMessages.slice(0, idx + 1);
        setSessions(prev => prev.map(s => s.id === activeSessionId ? { ...s, messages: finalMessages } : s));
        setEditingMsgId(null);
        handleSendMessage(null, null, finalMessages);
    };

    const handleFileUpload = (e) => {
        const file = e.target.files[0];
        if (!file) return;
        
        if (file.type.startsWith("image/")) {
             const reader = new FileReader();
             reader.onloadend = () => {
                 // Insert base64 string with a clear demarcator so the backend can extract it
                 setInput(prev => prev + `\n[Image Attached: ${file.name}]\n${reader.result}\n`);
             };
             reader.readAsDataURL(file);
        } else {
             setInput(prev => prev + ` [Attached File: ${file.name}] `);
        }
    };

    const handleSendMessage = async (e, customText = null, customMessages = null) => {
        if (e) e.preventDefault();
        
        // If it's a manual edit override, don't resend the input text
        const textToSend = customText || input;
        const currentMessages = customMessages || [...messages, { role: "user", content: textToSend.trim(), id: Date.now() }];
        
        if (!customMessages) {
            if (!textToSend.trim() || isLoading) return;
            setInput("");
            setSessions(prev => prev.map(s => s.id === activeSessionId ? { ...s, messages: currentMessages } : s));
        }

        setIsLoading(true);
        setThinkingSteps(["Parsing terminal input...", "Analyzing multimodal context...", "Constructing academic response..."]);

        try {
            const userMsg = currentMessages[currentMessages.length - 1].content;
            const isTechnicalRequest = /flowchart|diagram|system design|architecture|linked list|tree|graph/i.test(userMsg);
            
            const API_BASE_URL = import.meta.env.VITE_API_URL || (typeof window !== "undefined" && window.location.hostname === "localhost" ? "http://localhost:8000" : "");
            const response = await fetch(`${API_BASE_URL}/api/chat`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    message: isTechnicalRequest 
                        ? `${userMsg} (IMPORTANT: You MUST include a Mermaid.js diagram to visualize this architecture/logic)` 
                        : userMsg,
                    history: currentMessages.slice(-8).map(m => ({ role: m.role, content: m.content })),
                    complexity: complexity,
                    socratic_mode: socraticMode
                })
            });

            const data = await response.json();
            if (!data || (!data.response && !data.error)) throw new Error("Invalid response from AI service");

            
            // Show real thinking steps briefly before typing
            setThinkingSteps(data.thinking_steps || []);
            await new Promise(r => setTimeout(r, 1000));
            setThinkingSteps([]); // Clear thinking steps so the main UI can focus on reading
            
            // Insert empty message
            const newId = Date.now() + 1;
            const assistantMsg = { 
                role: "assistant", 
                content: "", 
                thinking: data.thinking_steps,
                id: newId,
                isTyping: true
            };
            
            setSessions(prev => prev.map(s => s.id === activeSessionId ? { ...s, messages: [...currentMessages, assistantMsg] } : s));
            
            // Simulate typing effect
            const fullText = data.response;
            let currentText = "";
            const chunkSize = Math.max(1, Math.floor(fullText.length / 50)); // Adapt to length
            
            for (let i = 0; i < fullText.length; i += chunkSize) {
                currentText = fullText.substring(0, i + chunkSize);
                setSessions(prev => prev.map(s => 
                    s.id === activeSessionId 
                    ? { ...s, messages: s.messages.map(m => m.id === newId ? { ...m, content: currentText } : m) } 
                    : s
                ));
                await new Promise(r => setTimeout(r, 15));
            }
            
            // Update analysis if provided
            if (data.analysis) {
                setAiAnalysis(data.analysis);
            }
            
            // Unset typing flag
            setSessions(prev => prev.map(s => 
                s.id === activeSessionId 
                ? { ...s, messages: s.messages.map(m => m.id === newId ? { ...m, isTyping: false } : m) } 
                : s
            ));
            
                } catch (error) { 
            console.error("[Socratic] ❌ Chat failure:", error);
            const fallbackMsg = { 
                role: "assistant", 
                content: "### 🔴 System Connectivity Issue\n\nI'm having trouble connecting to my core brain at `localhost:8000`. \n\n**Possible fixes:**\n1. Ensure `run_all.bat` is running in a terminal.\n2. Check your internet connection (needed for AI responses).\n3. If strictly local, please wait while I refresh my knowledge core.", 
                id: Date.now() + 2
            };
            setSessions(prev => prev.map(s => s.id === activeSessionId ? { ...s, messages: [...currentMessages, fallbackMsg] } : s));
        } finally { 
            setIsLoading(false); 
            setThinkingSteps([]); 
        }

    };

    useEffect(() => {
        let timer;
        if (isInterviewMode && interviewTimeLeft > 0) {
            timer = setInterval(() => setInterviewTimeLeft(prev => prev - 1), 1000);
        } else if (isInterviewMode && interviewTimeLeft <= 0) {
            setIsInterviewMode(false);
            handleSendMessage(null, "Time's up! The interview timer has ended. Please provide a detailed evaluation of my performance.")
                .catch(err => {
                    console.error('[Interview] AI evaluation failed:', err);
                    alert('Failed to get interview evaluation. The AI service may be unavailable. Please try again later.');
                });
        }
        return () => clearInterval(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [isInterviewMode, interviewTimeLeft]);

    const toggleMockInterview = () => {
        if (isInterviewMode) {
            setIsInterviewMode(false);
            setInterviewTimeLeft(0);
            handleSendMessage(null, "I would like to end the mock interview early. Please evaluate my overall performance.");
        } else {
            setIsExpanded(true);
            setIsInterviewMode(true);
            setInterviewTimeLeft(600); // 10 minutes
            handleSendMessage(null, "I want to start a strict 10-minute mock interview for a software engineering role. Please ask me the first technical question, and then wait for my response. Do not give away the answer. Act like a real interviewer.");
        }
    };

    const createNewSession = () => {
        const newId = Date.now().toString();
        setSessions([{ 
            id: newId, 
            title: "New Learning Session", 
            messages: [{ 
                role: "assistant", 
                id: Date.now(),
                content: "### Welcome back! 🎓\nI'm ready to dive into a new topic with you. What are we working on during this session?" 
            }] 
        }, ...sessions]);
        setActiveSessionId(newId);
    };

    const deleteSession = (e, id) => {
        e.stopPropagation();
        const filtered = sessions.filter(s => s.id !== id);
        if (filtered.length === 0) {
            createNewSession();
        } else {
            setSessions(filtered);
            if (activeSessionId === id) setActiveSessionId(filtered[0].id);
        }
    };

    return (
        /* Root container is ALWAYS full screen but non-blocking (pointer-events-none) */
        <div className="fixed inset-0 z-99999 font-sans pointer-events-none">
            <AnimatePresence>
                {isOpen && (
                    <motion.div
                        initial={{ opacity: 0, scale: 0.9, y: 50, x: "-50%", left: "50%" }}
                        animate={{ 
                            opacity: 1, scale: 1, y: 0,
                            width: isExpanded ? "min(1200px, 92vw)" : "min(820px, calc(100vw - 40px))",
                            height: isExpanded ? "85vh" : "min(78vh, 760px)",
                            top: isExpanded ? "7.5vh" : "max(12px, 8vh)",
                            left: "50%",
                            x: "-50%",
                            right: "auto",
                            bottom: "auto",
                        }}
                        exit={{ opacity: 0, scale: 0.9, y: 50, x: "-50%", left: "50%" }}
                        transition={{ type: "spring", damping: 30, stiffness: 200 }}
                        // Enable pointer events for the actual chat window
                        className="absolute bg-slate-950/98 border border-white/10 rounded-[28px] shadow-[0_0_80px_rgba(0,0,0,0.9)] flex overflow-hidden pointer-events-auto"
                    >
                        {/* SIDEBAR */}
                        <AnimatePresence>
                            {isExpanded && (
                                <motion.div initial={{ width: 0 }} animate={{ width: 280 }} className="h-full border-r border-white/5 bg-[linear-gradient(180deg,rgba(8,14,27,0.98),rgba(3,7,18,0.95))] flex flex-col shrink-0">
                                    <div className="p-4 pt-5">
                                        <div className="rounded-3xl border border-cyan-500/10 bg-[radial-gradient(circle_at_top,rgba(34,211,238,0.12),transparent_55%),rgba(255,255,255,0.02)] p-4">
                                            <div className="flex items-start justify-between gap-3">
                                                <div>
                                                    <p className="text-[10px] font-black uppercase tracking-[0.3em] text-cyan-400">Socratic Core</p>
                                                    <h4 className="mt-2 text-lg font-black text-white">Guided Learning Terminal</h4>
                                                    <p className="mt-2 text-xs leading-6 text-slate-400">Socratic prompts, interview practice, diagrams, and multimodal study support in one place.</p>
                                                </div>
                                                <div className="rounded-2xl border border-cyan-500/20 bg-cyan-500/10 px-3 py-2 text-[10px] font-black uppercase tracking-widest text-cyan-300">
                                                    Online
                                                </div>
                                            </div>
                                            <button onClick={createNewSession} className="mt-4 w-full py-3 px-4 rounded-2xl bg-white/5 border border-white/10 text-white text-xs font-black uppercase tracking-[0.24em] transition-all hover:bg-white/10">
                                                New Session
                                            </button>
                                        </div>
                                    </div>
                                    <div className="flex-1 overflow-y-auto space-y-1 px-2 custom-scrollbar">
                                        <p className="text-[9px] text-slate-600 uppercase px-4 mb-2 tracking-[0.24em]">History Logs</p>
                                        {sessions.map(s => (
                                            <div 
                                                key={s.id} 
                                                onClick={() => setActiveSessionId(s.id)} 
                                                className={`group w-full px-4 py-3 rounded-2xl cursor-pointer transition-all border
                                                    ${activeSessionId === s.id ? 'bg-cyan-500/10 text-cyan-400 border-cyan-500/20' : 'text-slate-500 border-transparent hover:bg-white/5 hover:text-slate-300'}`}
                                            >
                                                <div className="flex items-center justify-between gap-3">
                                                    <div className="min-w-0">
                                                        <div className="text-[11px] truncate font-bold">{s.title}</div>
                                                        <div className="mt-1 text-[9px] uppercase tracking-widest text-slate-600">{s.messages?.length || 0} messages</div>
                                                    </div>
                                                    <div className={`h-2 w-2 shrink-0 rounded-full ${activeSessionId === s.id ? 'bg-cyan-400' : 'bg-slate-700'}`} />
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                    
                                    {/* AI Intelligence Visibility */}
                                    <div className="p-4 border-t border-white/5 bg-white/2">
                                        <div className="flex items-center gap-2 mb-4">
                                            <div className="w-1.5 h-1.5 rounded-full bg-cyan-500 animate-pulse" />
                                            <span className="text-[10px] font-black uppercase text-slate-400 tracking-widest">AI Tutor Analysis</span>
                                        </div>
                                        <div className="space-y-4">
                                            <div>
                                                <div className="text-[9px] font-bold text-slate-500 uppercase mb-1.5">Focus Areas</div>
                                                <div className="flex flex-wrap gap-1.5">
                                                    <span className="px-2 py-0.5 rounded-md bg-rose-500/10 border border-rose-500/20 text-[9px] font-bold text-rose-400">Weak: {aiAnalysis.weak}</span>
                                                    <span className="px-2 py-0.5 rounded-md bg-blue-500/10 border border-blue-500/20 text-[9px] font-bold text-blue-400">Strong: {aiAnalysis.strong}</span>
                                                </div>
                                            </div>
                                            <div>
                                                <div className="flex justify-between items-center mb-1.5">
                                                    <span className="text-[9px] font-bold text-slate-500 uppercase">Confidence Level</span>
                                                    <span className="text-[10px] font-black text-cyan-400">{Math.round(aiAnalysis.confidence)}%</span>
                                                </div>
                                                <div className="w-full h-1 bg-slate-800 rounded-full overflow-hidden">
                                                    <div className="h-full bg-cyan-500 shadow-[0_0_10px_rgba(6,182,212,0.5)] transition-all duration-1000" style={{ width: `${aiAnalysis.confidence}%` }} />
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </motion.div>
                            )}
                        </AnimatePresence>

                        <div className="flex-1 flex flex-col h-full relative">
                            {/* HEADER */}
                            <div className="h-16 border-b border-white/5 px-6 flex items-center justify-between bg-[linear-gradient(180deg,rgba(2,6,23,0.96),rgba(6,11,24,0.88))] shrink-0">
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 rounded-2xl bg-linear-to-br from-cyan-500 to-indigo-600 flex items-center justify-center shadow-[0_10px_30px_rgba(34,211,238,0.24)]">
                                        <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeWidth={2.5} d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>
                                    </div>
                                    <div>
                                        <h3 className="text-white font-black text-xs uppercase tracking-[0.26em]">Socratic</h3>
                                        <div className="mt-1 flex items-center gap-2 text-[10px] text-slate-500">
                                            <span>{spokenLanguage || "Auto-detect"}</span>
                                            <span className="h-1 w-1 rounded-full bg-slate-700" />
                                            <span>{socraticMode ? "Guided mode" : "Direct mode"}</span>
                                        </div>
                                    </div>
                                    {isInterviewMode && (
                                        <div className="ml-2 px-3 py-1 bg-red-500/20 text-red-400 text-[10px] font-black uppercase tracking-widest rounded-full border border-red-500/30 animate-pulse transition-all">
                                            {formatTimer(interviewTimeLeft)}
                                        </div>
                                    )}
                                </div>
                                <div className="flex items-center gap-4 pr-3">
                                    <button 
                                        onClick={() => {
                                            if(window.confirm("Are you sure you want to clear this session's history?")) {
                                                setSessions(prev => prev.map(s => s.id === activeSessionId ? { ...s, messages: s.messages.slice(0, 1) } : s));
                                            }
                                        }} 
                                        className="p-2 text-slate-500 hover:text-rose-400 transition-colors"
                                        title="Clear Current Chat"
                                    >
                                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                        </svg>
                                    </button>
                                    <button onClick={() => setShowSettings(!showSettings)} className="p-2 text-slate-500 hover:text-white transition-colors" title="Settings"><svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" /></svg></button>
                                    <button onClick={() => setIsExpanded(!isExpanded)} className="p-2 text-slate-500 hover:text-white transition-colors" title="Expand View"><svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5l-5-5m5 5v-4m0 4h-4" /></svg></button>
                                    <button onClick={() => { 
                                        if (autoResetOnClose) {
                                            setSessions(prev => prev.map(s => s.id === activeSessionId ? { ...s, messages: s.messages.slice(0, 1) } : s));
                                        }
                                        setIsOpen(false); 
                                        setIsExpanded(false); 
                                    }} className="p-2 text-slate-500 hover:text-white transition-colors" title="Close"><svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path d="M6 18L18 6M6 6l12 12" /></svg></button>
                                </div>
                            </div>

                            <AnimatePresence>
                                {showSettings && (
                                    <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }} className="absolute top-16 left-0 right-0 p-6 bg-slate-900 border-b border-white/10 z-20 shadow-2xl">
                                        <h4 className="text-white font-bold text-sm mb-4">Portal Settings</h4>
                                        <div className="grid gap-4 md:grid-cols-2">
                                            <div className="rounded-2xl border border-white/8 bg-black/20 p-4">
                                                <div className="flex items-center justify-between"><span className="text-xs text-slate-400">Response Complexity</span><span className="text-xs font-black text-cyan-400">{complexity}/5</span></div>
                                                <input type="range" min="1" max="5" value={complexity} onChange={(e) => setComplexity(parseInt(e.target.value))} className="mt-3 w-full accent-cyan-500 cursor-pointer" />
                                            </div>
                                            <div className="flex items-center justify-between">
                                                <span className="text-xs text-slate-400">Auto-Reset on Close</span>
                                                <button 
                                                    onClick={() => setAutoResetOnClose(!autoResetOnClose)}
                                                    className={`w-10 h-5 rounded-full transition-colors relative ${autoResetOnClose ? 'bg-cyan-500' : 'bg-slate-700'}`}
                                                >
                                                    <div className={`absolute top-1 w-3 h-3 bg-white rounded-full transition-all ${autoResetOnClose ? 'left-6' : 'left-1'}`} />
                                                </button>
                                            </div>
                                            <div className="flex items-center justify-between">
                                                <div className="flex flex-col">
                                                    <span className="text-xs text-slate-400 font-bold">Socratic Mode</span>
                                                    <span className="text-[10px] text-slate-500 italic">Probe with questions</span>
                                                </div>
                                                <button 
                                                    onClick={() => setSocraticMode(!socraticMode)}
                                                    className={`w-10 h-5 rounded-full transition-colors relative ${socraticMode ? 'bg-emerald-500' : 'bg-slate-700'}`}
                                                >
                                                    <div className={`absolute top-1 w-3 h-3 bg-white rounded-full transition-all ${socraticMode ? 'left-6' : 'left-1'}`} />
                                                </button>
                                            </div>
                                            <button onClick={() => setSessions([{ id: Date.now().toString(), title: "History Cleared", messages: [] }])} className="text-xs text-rose-500 hover:text-rose-400 transition-colors text-left">Wipe History Logs</button>
                                        </div>
                                    </motion.div>
                                )}
                            </AnimatePresence>

                            <div ref={scrollRef} className="flex-1 overflow-y-auto bg-[radial-gradient(circle_at_top,rgba(34,211,238,0.05),transparent_35%),linear-gradient(180deg,rgba(2,6,23,0.85),rgba(2,6,23,1))] p-4 md:p-8 custom-scrollbar">
                                <div className={`mx-auto ${isExpanded ? 'max-w-3xl' : 'max-w-2xl w-full'} space-y-6 pt-6 px-4`}>
                                    <div className="rounded-3xl border border-white/6 bg-white/2 px-5 py-4">
                                        <div className="flex flex-wrap items-center gap-3">
                                            <span className="rounded-full border border-cyan-500/20 bg-cyan-500/10 px-3 py-1 text-[10px] font-black uppercase tracking-[0.24em] text-cyan-300">Active Session</span>
                                            <span className="text-sm font-bold text-white">{activeSession?.title}</span>
                                            <span className="text-xs text-slate-500">{messages.length} messages</span>
                                        </div>
                                        <p className="mt-2 text-xs leading-6 text-slate-400">Use the quick actions below for hints, diagrams, harder questions, and focused follow-ups without rewriting your whole prompt.</p>
                                    </div>
                                    {messages.map((msg, idx) => (
                                        <div key={idx} className="group relative">
                                            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                                                <div className={`p-4 px-5 rounded-2xl text-[13.5px] leading-relaxed relative ${msg.role === 'user' ? 'bg-linear-to-br from-indigo-600 to-violet-700 text-white rounded-tr-none max-w-[85%] shadow-xl shadow-indigo-500/10' : 'bg-slate-900/80 backdrop-blur-md border border-white/10 text-slate-200 rounded-tl-none w-full shadow-lg'}`}>
                                                    {editingMsgId === idx ? (
                                                        <div className="space-y-2">
                                                            <textarea value={editValue} onChange={(e) => setEditValue(e.target.value)} className="w-full bg-black/20 text-white border border-white/10 rounded p-2 text-xs focus:outline-none" />
                                                            <div className="flex gap-2"><button onClick={() => saveEdit(idx)} className="text-[10px] bg-cyan-500 text-white px-2 py-1 rounded">Save & Reroute</button><button onClick={() => setEditingMsgId(null)} className="text-[10px] opacity-50 shadow-md">Cancel</button></div>
                                                        </div>
                                                    ) : (
                                                        <div className="space-y-4">
                                                            <ReactMarkdown 
                                                                remarkPlugins={[remarkGfm]} 
                                                                components={{ 
                                                                    p: ({...props}) => <p className="mb-2 last:mb-0 leading-relaxed" {...props} />,
                                                                    h1: ({...props}) => <h1 className="text-base font-bold text-white mt-4 mb-2" {...props} />,
                                                                    h2: ({...props}) => <h2 className="text-sm font-bold text-white mt-3 mb-1.5" {...props} />,
                                                                    h3: ({...props}) => <h3 className="text-[13px] font-bold text-slate-200 mt-3 mb-1" {...props} />,
                                                                    ul: ({...props}) => <ul className="list-disc pl-5 space-y-1 my-2" {...props} />,
                                                                    ol: ({...props}) => <ol className="list-decimal pl-5 space-y-1 my-2" {...props} />,
                                                                    li: ({...props}) => <li className="text-slate-300" {...props} />,
                                                                    blockquote: ({...props}) => <blockquote className="border-l-2 border-cyan-500/50 pl-3 my-2 text-slate-400 italic" {...props} />,
                                                                    strong: ({...props}) => <strong className="text-white font-semibold" {...props} />,
                                                                    a: ({...props}) => <a className="text-cyan-400 underline hover:text-cyan-300" target="_blank" rel="noopener noreferrer" {...props} />,
                                                                    img: ({alt, src, ...props}) => (
                                                                        <div className="my-3">
                                                                            <img src={src} alt={alt} className="rounded-xl max-w-full border border-white/10" {...props} />
                                                                            {alt && <p className="text-[10px] text-slate-500 mt-1 text-center">{alt}</p>}
                                                                        </div>
                                                                    ),
                                                                    table: ({...props}) => <div className="overflow-x-auto my-3"><table className="w-full text-xs border-collapse" {...props} /></div>,
                                                                    th: ({...props}) => <th className="border border-white/10 px-3 py-2 bg-white/5 text-slate-300 font-bold text-left" {...props} />,
                                                                    td: ({...props}) => <td className="border border-white/10 px-3 py-2 text-slate-400" {...props} />,
                                                                    code({inline, className, children, ...props}) {
                                                                        const match = /language-(\w+)/.exec(className || '');
                                                                        const lang = match?.[1];
                                                                        if (!inline && lang === 'mermaid') {
                                                                            return <Mermaid chart={String(children).replace(/\n$/, '')} />;
                                                                        }
                                                                        if (!inline && lang) {
                                                                            return <CodeBlock language={lang}>{children}</CodeBlock>;
                                                                        }
                                                                        return <code className="px-1.5 py-0.5 rounded bg-white/10 text-cyan-300 text-[12px] font-mono" {...props}>{children}</code>;
                                                                    }
                                                                }}
                                                            >
                                                                {msg.content}
                                                            </ReactMarkdown>
                                                            {msg.isTyping && (
                                                                <span className="inline-block w-2 h-4 ml-1 mt-1 bg-cyan-400 animate-pulse border-b-2 border-cyan-300"></span>
                                                            )}
                                                        </div>
                                                    )}
                                                    {msg.role === 'user' && editingMsgId !== idx && (
                                                        <button onClick={() => startEditing(msg, idx)} className="absolute -left-8 top-1 opacity-0 group-hover:opacity-100 p-1 text-slate-500 hover:text-white transition-opacity"><svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" /></svg></button>
                                                    )}
                                                    {msg.role === 'assistant' && (
                                                        <button 
                                                            onClick={() => speakMessage(msg.content)} 
                                                            className="absolute -right-8 top-1 opacity-0 group-hover:opacity-100 p-1 text-slate-500 hover:text-cyan-400 transition-all hover:scale-110"
                                                            title="Listen to Explanation"
                                                        >
                                                            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.536 8.464a5 5 0 010 7.072m2.828-9.9a9 9 0 010 12.728M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z" />
                                                            </svg>
                                                        </button>
                                                    )}
                                                </div>
                                            </motion.div>
                                        </div>
                                    ))}
                                    {isLoading && (
                                        <div className="bg-slate-900/50 p-4 rounded-xl border border-white/5 space-y-2">
                                            <div className="flex gap-1"><div className="w-1 h-1 bg-cyan-500 rounded-full animate-bounce" /><div className="w-1 h-1 bg-cyan-500 rounded-full animate-bounce [animation-delay:-0.1s]" /><div className="w-1 h-1 bg-cyan-500 rounded-full animate-bounce [animation-delay:-0.2s]" /></div>
                                            {thinkingSteps.map((s, i) => <p key={i} className="text-[10px] text-slate-500 font-mono italic">{s}</p>)}
                                        </div>
                                    )}
                                </div>
                            </div>

                            <div className="p-4 bg-slate-950 border-t border-white/5 shrink-0">
                                <div className="mx-auto max-w-2xl space-y-3 px-4">
                                    <div className="rounded-2xl border border-white/8 bg-white/2 p-3">
                                        <div className="mb-3 flex items-center justify-between gap-3">
                                            <div>
                                                <div className="text-[10px] font-black uppercase tracking-[0.24em] text-slate-500">Quick Actions</div>
                                                <div className="mt-1 text-xs text-slate-400">Guide the bot without rewriting your prompt.</div>
                                            </div>
                                            <div className="text-[10px] font-black uppercase tracking-widest text-cyan-400">{isInterviewMode ? "Interview running" : "Study ready"}</div>
                                        </div>
                                        <div className="flex items-center gap-2 overflow-x-auto pb-1 custom-scrollbar w-full">
                                        <button 
                                            onClick={toggleMockInterview}
                                            className={`whitespace-nowrap px-3 py-1.5 rounded-lg border text-[10px] font-bold transition-all ${isInterviewMode ? 'bg-rose-500/20 border-rose-500/50 text-rose-400 shadow-[0_0_10px_rgba(244,63,94,0.3)]' : 'bg-white/5 border-white/10 text-slate-400 hover:bg-rose-500/10 hover:border-rose-500/50 hover:text-rose-400'}`}
                                        >
                                            {isInterviewMode ? 'End Mock Interview' : 'Start Mock Interview'}
                                        </button>
                                        {quickActions.map((action) => (
                                            <button 
                                                key={action.label}
                                                onClick={() => handleSendMessage(null, action.prompt)}
                                                className={`whitespace-nowrap px-3 py-1.5 rounded-lg bg-white/5 border border-white/10 text-[10px] font-bold text-slate-400 transition-all ${action.className}`}
                                            >
                                                {action.label}
                                            </button>
                                        ))}
                                        <div className="w-px h-4 bg-white/10 mx-1 shrink-0" />
                                        <button onClick={() => fileInputRef.current.click()} className="p-2 bg-white/5 rounded-lg text-slate-500 hover:text-cyan-400" title="Add Media"><svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2-2v12a2 2 0 002 2z" /></svg></button>
                                        <button onClick={() => cameraInputRef.current.click()} className="p-2 bg-white/5 rounded-lg text-slate-500 hover:text-cyan-400" title="Take Photo"><svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" /></svg></button>
                                        <button onClick={startVoiceTyping} className={`p-2 rounded-lg transition-all ${isListening ? 'bg-rose-500 text-white animate-pulse' : 'bg-white/5 text-slate-500 hover:text-rose-400'}`} title="Voice Typing"><svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" /></svg></button>
                                        </div>
                                    </div>
                                    <div className="relative">
                                        <textarea value={input} onChange={(e) => setInput(e.target.value)} onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSendMessage(); } }} placeholder="Ask Socratic anything..." rows={1} className="w-full bg-slate-900 border border-white/10 rounded-2xl py-4 pl-5 pr-14 text-sm text-white focus:outline-none focus:border-cyan-500/50 resize-none max-h-32 min-h-[54px]" />
                                        <button onClick={() => handleSendMessage()} disabled={!input.trim() || isLoading} className="absolute right-3 bottom-2.5 w-9 h-9 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white flex items-center justify-center transition-all disabled:opacity-20 shadow-[0_10px_30px_rgba(8,145,178,0.35)]"><svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeWidth={2.5} d="M13 7l5 5m0 0l-5 5m5-5H6" /></svg></button>
                                    </div>
                                    <div className="flex items-center justify-between gap-3 px-1 text-[10px] text-slate-500">
                                        <span>`Enter` sends, `Shift + Enter` adds a new line.</span>
                                        <span>{socraticMode ? "Socratic mode on" : "Direct coaching mode"}</span>
                                    </div>
                                    <input type="file" ref={fileInputRef} onChange={handleFileUpload} className="hidden" />
                                    <input type="file" ref={cameraInputRef} accept="image/*" capture="environment" onChange={handleFileUpload} className="hidden" />
                                </div>
                            </div>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            {!isOpen && (
                <div className="fixed bottom-6 right-6 z-50 flex items-center justify-end">
                    <motion.button 
                        layout
                        initial="initial"
                        whileHover="hover"
                        onClick={() => { setIsOpen(true); setShowWelcome(false); }} 
                        className={`group h-16 rounded-2xl bg-[linear-gradient(135deg,rgba(2,6,23,0.98),rgba(11,18,32,0.98))] border border-white/10 text-white flex items-center pr-4 gap-2 pointer-events-auto shadow-2xl transition-all overflow-hidden relative ${showWelcome ? 'ring-2 ring-cyan-500 shadow-[0_0_30px_rgba(6,182,212,0.4)]' : ''}`}
                    >
                        <div className="absolute inset-0 bg-linear-to-br from-cyan-500 to-purple-600 opacity-0 group-hover:opacity-10 transition-all rounded-2xl" />
                        
                        <div className="w-16 h-16 min-w-[64px] flex items-center justify-center relative z-10">
                            <svg className="w-8 h-8 text-cyan-400 drop-shadow-[0_0_8px_rgba(34,211,238,0.5)]" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>
                        </div>

                        <motion.div 
                            variants={{
                                initial: { opacity: 0, x: -10, width: 0, marginLeft: -10 },
                                hover: { opacity: 1, x: 0, width: 'auto', marginLeft: 0 }
                            }}
                            transition={{ type: "spring", damping: 25, stiffness: 200 }}
                            className="whitespace-nowrap overflow-hidden pr-2 z-10"
                        >
                            <span className="text-sm font-black text-white uppercase tracking-widest block">Socratic</span>
                            <span className="text-[10px] text-cyan-400/80 font-bold block leading-none">Need any help?</span>
                        </motion.div>
                    </motion.button>
                </div>
            )}
        </div>
    );
};

export default Socratic;
