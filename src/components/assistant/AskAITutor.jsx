import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChatAgent } from '../../agents/ChatAgent';

const AskAITutor = () => {
    const [messages, setMessages] = useState([
        { 
            role: 'assistant', 
            text: "Welcome to your **Advanced Learning Nexus**. I am your AI Architect. \n\nWhat complex concept shall we deconstruct today? I'm ready for Data Structures, System Design, or anything in the realm of Computing.",
            isNew: true
        }
    ]);
    const [input, setInput] = useState('');
    const [isTyping, setIsTyping] = useState(false);
    const scrollRef = useRef(null);

    // Auto-scroll logic
    useEffect(() => {
        if (scrollRef.current) {
            scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
        }
    }, [messages, isTyping]);

    const suggestions = [
        "Explain Dynamic Programming",
        "How do B-Trees work?",
        "Explain CAP Theorem",
        "Roadmap to Backend Mastery"
    ];

    const handleSubmit = async (e, forcedInput = null) => {
        if (e) e.preventDefault();
        const finalInput = forcedInput || input;
        if (!finalInput.trim() || isTyping) return;

        const userMsg = { role: 'user', text: finalInput };
        setMessages(prev => [...prev.map(m => ({ ...m, isNew: false })), userMsg]);
        setInput('');
        setIsTyping(true);

        try {
            const history = messages.map(m => ({
                role: m.role,
                content: m.text
            }));

            const response = await ChatAgent.sendMessage(finalInput, history);
            
            setMessages(prev => [
                ...prev, 
                { role: 'assistant', text: response, isNew: true }
            ]);
        } catch (err) {
            setMessages(prev => [
                ...prev, 
                { role: 'assistant', text: "⚠ **System Error:** Failed to establish neural link with the backend. Ensure port 8000 is open.", isNew: true }
            ]);
        } finally {
            setIsTyping(false);
        }
    };

    return (
        <div className="flex flex-col h-full bg-[#030712] text-slate-200 font-sans selection:bg-cyan-500/30">
            {/* Background Texture */}
            <div className="absolute inset-0 opacity-[0.03] pointer-events-none bg-[url('https://grainy-gradients.vercel.app/noise.svg')]"></div>
            
            {/* Message Stream */}
            <div 
                ref={scrollRef}
                className="flex-1 overflow-y-auto px-6 py-8 md:px-12 space-y-10 scrollbar-none"
            >
                <div className="max-w-4xl mx-auto w-full space-y-10">
                    {messages.map((msg, idx) => (
                        <motion.div
                            key={idx}
                            initial={msg.isNew ? { opacity: 0, y: 20 } : false}
                            animate={{ opacity: 1, y: 0 }}
                            className={`flex gap-6 ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
                        >
                            <div className={`flex gap-4 max-w-[90%] md:max-w-[80%] ${msg.role === 'user' ? 'flex-row-reverse text-right' : 'flex-row'}`}>
                                {/* Icon */}
                                <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 mt-1 border ${
                                    msg.role === 'user' 
                                    ? 'bg-indigo-600/10 border-indigo-500/20 text-indigo-400' 
                                    : 'bg-cyan-600/10 border-cyan-500/20 text-cyan-400'
                                }`}>
                                    {msg.role === 'user' ? (
                                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg>
                                    ) : (
                                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>
                                    )}
                                </div>

                                {/* Content */}
                                <div className="space-y-2">
                                    <div className={`text-[10px] font-mono uppercase tracking-[0.2em] opacity-40 ${msg.role === 'user' ? 'text-indigo-400' : 'text-cyan-400'}`}>
                                        {msg.role === 'user' ? 'Requester' : 'AI Architect'}
                                    </div>
                                    <div className={`leading-relaxed text-[15px] font-light ${msg.role === 'user' ? 'text-indigo-50/90' : 'text-slate-100/90'}`}>
                                        {msg.text.split('\n').map((line, i) => (
                                            <p key={i} className={i > 0 ? 'mt-3' : ''}>
                                                {line.includes('**') ? (
                                                    line.split('**').map((part, pi) => pi % 2 === 1 ? <strong key={pi} className="font-bold text-cyan-400">{part}</strong> : part)
                                                ) : line}
                                            </p>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        </motion.div>
                    ))}

                    {isTyping && (
                        <div className="flex gap-4">
                            <div className="w-8 h-8 rounded-full flex items-center justify-center shrink-0 bg-cyan-600/10 border border-cyan-500/20 text-cyan-400">
                                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>
                            </div>
                            <div className="flex items-center gap-1.5 px-4 h-8 bg-slate-900/50 rounded-full border border-white/5">
                                <span className="w-1.5 h-1.5 bg-cyan-500 rounded-full animate-pulse"></span>
                                <span className="text-[10px] font-mono text-cyan-500/60 uppercase tracking-widest">Constructing Response</span>
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {/* Input & Control Center */}
            <div className="p-6 md:p-10 shrink-0 bg-linear-to-t from-[#030712] via-[#030712] to-transparent">
                <div className="max-w-3xl mx-auto w-full space-y-6">
                    
                    {/* Suggestions */}
                    {messages.length < 3 && !isTyping && (
                        <div className="flex flex-wrap gap-2 justify-center">
                            {suggestions.map((s, i) => (
                                <button
                                    key={i}
                                    onClick={() => handleSubmit(null, s)}
                                    className="px-4 py-1.5 rounded-full bg-white/5 border border-white/10 text-xs text-slate-400 hover:bg-cyan-500/10 hover:text-cyan-400 hover:border-cyan-500/30 transition-all duration-300"
                                >
                                    {s}
                                </button>
                            ))}
                        </div>
                    )}

                    {/* Main Input Area */}
                    <form 
                        onSubmit={handleSubmit}
                        className="relative group block"
                    >
                        <div className="absolute -inset-1 bg-linear-to-r from-cyan-600/20 to-indigo-600/20 rounded-2xl blur-xl opacity-0 group-focus-within:opacity-100 transition duration-500"></div>
                        <div className="relative flex items-end bg-[#0B1221] border border-white/10 rounded-2xl px-2 py-2 shadow-2xl transition-all duration-300 group-focus-within:border-cyan-500/50">
                            <textarea
                                value={input}
                                onChange={(e) => setInput(e.target.value)}
                                onKeyDown={(e) => {
                                    if (e.key === 'Enter' && !e.shiftKey) {
                                        e.preventDefault();
                                        handleSubmit();
                                    }
                                }}
                                placeholder="Describe a concept you'd like to master..."
                                rows={1}
                                className="flex-1 bg-transparent px-4 py-3 text-[15px] outline-none resize-none placeholder:text-slate-600 scrollbar-none max-h-40"
                                style={{ height: 'auto' }}
                                ref={el => {
                                    if (el) {
                                        el.style.height = 'auto';
                                        el.style.height = el.scrollHeight + 'px';
                                    }
                                }}
                            />
                            <button
                                type="submit"
                                disabled={!input.trim() || isTyping}
                                className={`p-3 rounded-xl transition-all duration-300 ${
                                    input.trim() && !isTyping 
                                    ? 'bg-cyan-500 text-slate-950 shadow-[0_0_20px_rgba(6,182,212,0.4)]' 
                                    : 'bg-slate-800 text-slate-500 opacity-20'
                                }`}
                            >
                                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                                </svg>
                            </button>
                        </div>
                        <div className="mt-3 text-[10px] text-center text-slate-600 font-mono tracking-widest uppercase">
                            Shift + Enter for new line • Advanced Tutoring Engine v3.0
                        </div>
                    </form>
                </div>
            </div>
        </div>
    );
};

export default AskAITutor;
