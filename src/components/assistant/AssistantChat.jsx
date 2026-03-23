import React, { useState } from 'react';
import { TeacherAgent } from '../../agents/TeacherAgent';

const AssistantChat = () => {
    const [mode, setMode] = useState('teach'); // 'teach' | 'evaluate'
    const [question, setQuestion] = useState('');
    const [userAnswer, setUserAnswer] = useState('');
    
    // Core State
    const [topic, setTopic] = useState('');
    const [difficulty, setDifficulty] = useState('beginner');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [response, setResponse] = useState(null);

    const [history, setHistory] = useState([]);

    const handleTeach = async () => {
        if (!topic) return;
        setLoading(true);
        setError(null);
        setResponse(null);

        try {
            const data = await TeacherAgent.teachConcept(topic, difficulty, history);
            setResponse(data);
            
            // Update history
            setHistory(prev => [
                ...prev,
                { role: "user", content: `Topic: ${topic}\nDifficulty: ${difficulty}` },
                { role: "assistant", content: JSON.stringify(data) }
            ]);
            
        } catch (err) {
            console.error("Teach API Error:", err);
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    const handleEvaluate = async () => {
        if (!topic || !question || !userAnswer) return;
        setLoading(true);
        setError(null);
        setResponse(null);

        try {
            const res = await fetch("http://localhost:5000/api/evaluate", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ topic, question, userAnswer })
            });

            if (!res.ok) {
                const errData = await res.json().catch(() => ({}));
                throw new Error(errData.error || `Error ${res.status}: ${res.statusText}`);
            }

            const data = await res.json();
            setResponse(data);
        } catch (err) {
            console.error("Evaluate API Error:", err);
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="flex flex-col gap-5 p-5 text-white h-full overflow-y-auto bg-[radial-gradient(circle_at_top,rgba(34,211,238,0.06),transparent_30%),linear-gradient(180deg,rgba(2,6,23,0.85),rgba(2,6,23,1))]">
            <div className="rounded-3xl border border-white/8 bg-white/[0.03] p-5">
                <div className="flex items-start justify-between gap-4">
                    <div>
                        <div className="text-[10px] font-black uppercase tracking-[0.28em] text-cyan-400">Tutor Studio</div>
                        <h3 className="mt-2 text-2xl font-black text-white">Teach, evaluate, and iterate faster</h3>
                        <p className="mt-2 max-w-2xl text-sm leading-7 text-slate-400">
                            Use this panel for direct topic teaching or quick grading flows when you want a more structured assistant interaction.
                        </p>
                    </div>
                    <div className="rounded-2xl border border-cyan-500/20 bg-cyan-500/10 px-4 py-3 text-right">
                        <div className="text-[10px] font-black uppercase tracking-widest text-cyan-300">Mode</div>
                        <div className="mt-1 text-sm font-bold text-white">{mode === 'teach' ? 'Teach Concept' : 'Evaluate Answer'}</div>
                    </div>
                </div>
            </div>
            {/* Mode Switcher */}
            <div className="flex bg-slate-900/80 p-1 rounded-2xl border border-white/5">
                <button 
                    onClick={() => { setMode('teach'); setResponse(null); setError(null); setHistory([]); }}
                    className={`flex-1 py-1.5 text-xs font-bold uppercase tracking-wider rounded-md transition-all ${mode === 'teach' ? 'bg-blue-600 text-white shadow-lg' : 'text-slate-500 hover:text-slate-300'}`}
                >
                    Teach
                </button>
                <button 
                    onClick={() => { setMode('evaluate'); setResponse(null); setError(null); setHistory([]); }}
                    className={`flex-1 py-1.5 text-xs font-bold uppercase tracking-wider rounded-md transition-all ${mode === 'evaluate' ? 'bg-purple-600 text-white shadow-lg' : 'text-slate-500 hover:text-slate-300'}`}
                >
                    Evaluate
                </button>
            </div>

            <div className="grid gap-4 lg:grid-cols-2">
            <div className="flex flex-col gap-2">
                <label className="text-xs font-bold uppercase tracking-wider text-slate-400">Topic</label>
                <input 
                    type="text" 
                    value={topic}
                    onChange={(e) => setTopic(e.target.value)}
                    placeholder="e.g. Photosynthesis, Binary Search..."
                    className="bg-slate-900 border border-slate-700 rounded-lg p-3 text-sm focus:ring-2 focus:ring-blue-500 outline-none transition-all placeholder:text-slate-600"
                />
            </div>
            <div className="rounded-2xl border border-white/8 bg-white/[0.03] p-4">
                <div className="text-[10px] font-black uppercase tracking-[0.24em] text-slate-500">Session Guidance</div>
                <div className="mt-3 space-y-2 text-sm leading-6 text-slate-400">
                    <p>Choose `Teach` to get explanation, example, and a practice prompt.</p>
                    <p>Choose `Evaluate` when you already have a question and want feedback.</p>
                    <p>Use the output card below as a compact lesson workspace.</p>
                </div>
            </div>
            </div>

            {mode === 'teach' && (
                <div className="flex flex-col gap-2">
                    <label className="text-xs font-bold uppercase tracking-wider text-slate-400">Difficulty</label>
                    <select 
                        value={difficulty}
                        onChange={(e) => setDifficulty(e.target.value)}
                        className="bg-slate-900 border border-slate-700 rounded-lg p-3 text-sm focus:ring-2 focus:ring-blue-500 outline-none transition-all"
                    >
                        <option value="beginner">Beginner</option>
                        <option value="intermediate">Intermediate</option>
                        <option value="advanced">Advanced</option>
                    </select>
                </div>
            )}

            {mode === 'evaluate' && (
                <>
                    <div className="flex flex-col gap-2">
                        <label className="text-xs font-bold uppercase tracking-wider text-slate-400">Question</label>
                        <input 
                            type="text" 
                            value={question}
                            onChange={(e) => setQuestion(e.target.value)}
                            placeholder="e.g. What is the time complexity of BFS?"
                            className="bg-slate-900 border border-slate-700 rounded-lg p-3 text-sm focus:ring-2 focus:ring-purple-500 outline-none transition-all placeholder:text-slate-600"
                        />
                    </div>
                    <div className="flex flex-col gap-2">
                        <label className="text-xs font-bold uppercase tracking-wider text-slate-400">Your Answer</label>
                        <textarea 
                            value={userAnswer}
                            onChange={(e) => setUserAnswer(e.target.value)}
                            placeholder="Type your answer here..."
                            rows={3}
                            className="bg-slate-900 border border-slate-700 rounded-lg p-3 text-sm focus:ring-2 focus:ring-purple-500 outline-none transition-all placeholder:text-slate-600 resize-none"
                        />
                    </div>
                </>
            )}

            <button 
                onClick={mode === 'teach' ? handleTeach : handleEvaluate}
                disabled={loading || !topic || (mode === 'evaluate' && (!question || !userAnswer))}
                className={`mt-2 font-bold py-3 px-4 rounded-xl shadow-lg border border-white/10 transition-all flex justify-center items-center gap-2 ${
                    mode === 'teach' 
                    ? 'bg-linear-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500' 
                    : 'bg-linear-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500'
                } disabled:opacity-50 disabled:cursor-not-allowed text-white`}
            >
                {loading ? (
                    <>
                        <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                        <span>Thinking...</span>
                    </>
                ) : (
                    <>
                        <span>{mode === 'teach' ? '🎓 Teach Me' : '📝 Grade Me'}</span>
                    </>
                )}
            </button>

            {error && (
                <div className="mt-4 bg-red-500/10 border border-red-500/20 text-red-400 p-4 rounded-xl text-sm leading-relaxed">
                    <strong>Error:</strong> {error}
                </div>
            )}

            {response && mode === 'teach' && (
                <div className="flex flex-col gap-4 mt-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
                    <div className="bg-slate-800/40 border border-white/5 p-4 rounded-xl backdrop-blur-sm">
                        <div className="flex items-center gap-2 mb-2">
                            <span className="w-2 h-2 rounded-full bg-blue-400"></span>
                            <h4 className="text-slate-200 font-bold text-sm uppercase tracking-wide">Explanation</h4>
                        </div>
                        <p className="text-slate-300 text-sm leading-relaxed">{response.explanation}</p>
                    </div>

                    <div className="bg-slate-800/40 border border-white/5 p-4 rounded-xl backdrop-blur-sm">
                         <div className="flex items-center gap-2 mb-2">
                            <span className="w-2 h-2 rounded-full bg-green-400"></span>
                            <h4 className="text-slate-200 font-bold text-sm uppercase tracking-wide">Example</h4>
                        </div>
                        <p className="text-slate-300 text-sm italic border-l-2 border-green-500/30 pl-3">"{response.example}"</p>
                    </div>

                    <div className="bg-slate-800/40 border border-white/5 p-4 rounded-xl backdrop-blur-sm">
                         <div className="flex items-center gap-2 mb-2">
                            <span className="w-2 h-2 rounded-full bg-purple-400"></span>
                            <h4 className="text-slate-200 font-bold text-sm uppercase tracking-wide">Practice</h4>
                        </div>
                        <p className="text-slate-300 text-sm font-medium">{response.practice_question}</p>
                        <button 
                            onClick={() => {
                                setQuestion(response.practice_question);
                                setMode('evaluate');
                                setResponse(null); // Clear previous response to show input form
                                setError(null);
                            }}
                            className="mt-3 w-full py-2 bg-purple-600/20 hover:bg-purple-600/30 text-purple-300 text-xs font-bold uppercase tracking-wider rounded-lg border border-purple-500/30 transition-all flex items-center justify-center gap-2"
                        >
                            <span>✍️ Attempt This Question</span>
                        </button>
                    </div>
                </div>
            )}

            {response && mode === 'evaluate' && (
                <div className="flex flex-col gap-4 mt-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
                    <div className={`p-4 rounded-xl border flex items-center justify-between ${response.is_correct ? 'bg-green-500/10 border-green-500/20' : 'bg-red-500/10 border-red-500/20'}`}>
                         <div>
                            <div className="text-slate-400 text-xs uppercase tracking-wider mb-1">Result</div>
                            <div className={`text-xl font-bold ${response.is_correct ? 'text-green-400' : 'text-red-400'}`}>
                                {response.is_correct ? 'Correct' : 'Needs Improvement'}
                            </div>
                         </div>
                         <div className="text-right">
                            <div className="text-slate-400 text-xs uppercase tracking-wider mb-1">Score</div>
                            <div className="text-2xl font-bold text-white">{response.score}/100</div>
                         </div>
                    </div>

                    <div className="bg-slate-800/40 border border-white/5 p-4 rounded-xl backdrop-blur-sm">
                        <div className="flex items-center gap-2 mb-2">
                            <span className="w-2 h-2 rounded-full bg-blue-400"></span>
                            <h4 className="text-slate-200 font-bold text-sm uppercase tracking-wide">Feedback</h4>
                        </div>
                        <p className="text-slate-300 text-sm leading-relaxed">{response.feedback}</p>
                    </div>
                </div>
            )}
        </div>
    );
};

export default AssistantChat;
