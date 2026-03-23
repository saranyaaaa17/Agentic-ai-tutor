
import { useEffect, useState } from "react";
import { executeCode } from "../utils/codeExecution";

const Icon = {
    Cpu: (props) => (
        <svg {...props} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <rect x="4" y="4" width="16" height="16" rx="2" ry="2" />
            <rect x="9" y="9" width="6" height="6" />
            <line x1="9" y1="1" x2="9" y2="4" />
            <line x1="15" y1="1" x2="15" y2="4" />
            <line x1="9" y1="20" x2="9" y2="23" />
            <line x1="15" y1="20" x2="15" y2="23" />
            <line x1="20" y1="9" x2="23" y2="9" />
            <line x1="20" y1="15" x2="23" y2="15" />
            <line x1="1" y1="9" x2="4" y2="9" />
            <line x1="1" y1="15" x2="4" y2="15" />
        </svg>
    )
};

const CodePlayground = ({
    language,
    initialCode,
    initialInput = "",
    value,
    onChange,
    stdinValue,
    onStdinChange,
    onRunComplete,
    actionSlot = null
}) => {
    const [code, setCode] = useState(initialCode || "print('Hello, AI Tutor!')");
    const [output, setOutput] = useState("");
    const [isRunning, setIsRunning] = useState(false);
    const [lang, setLang] = useState(language || "python");
    const [stdin, setStdin] = useState(initialInput);
    const [selection, setSelection] = useState(null);
    const currentCode = value ?? code;
    const currentInput = stdinValue ?? stdin;

    useEffect(() => {
        setCode(initialCode || "print('Hello, AI Tutor!')");
    }, [initialCode]);

    useEffect(() => {
        setLang(language || "python");
    }, [language]);

    useEffect(() => {
        setStdin(initialInput || "");
    }, [initialInput]);

    const handleMouseUp = (e) => {
        const text = currentCode.substring(e.target.selectionStart, e.target.selectionEnd);
        if (text.trim().length > 5) {
            setSelection({ text: text.trim(), x: e.clientX, y: e.clientY });
        } else {
            setSelection(null);
        }
    };

    const askSocratic = () => {
        if (!selection) return;
        window.dispatchEvent(new CustomEvent('askSocratic', { detail: { text: selection.text } }));
        setSelection(null);
    };

    const runCode = async () => {
        setIsRunning(true);
        setOutput("Compiling...");
        const result = await executeCode(lang, currentCode, currentInput);
        setIsRunning(false);
        setOutput(result.output || result.error || "No output.");
        onRunComplete?.(result, { language: lang, code: currentCode, stdin: currentInput });
    };

    return (
        <div className="flex flex-col h-full bg-slate-900 rounded-xl overflow-hidden border border-white/10 shadow-2xl">
            {/* Toolbar */}
            <div className="flex items-center justify-between px-4 py-3 bg-slate-800 border-b border-white/5">
                <div className="flex items-center gap-3">
                    <span className="text-xs font-mono text-slate-400 uppercase tracking-widest">Compiler</span>
                    <select 
                        value={lang} 
                        onChange={(e) => setLang(e.target.value)}
                        className="bg-black/30 text-white text-xs px-2 py-1 rounded border border-white/10 focus:outline-none focus:border-green-500"
                    >
                        <option value="python">Python 3</option>
                        <option value="javascript">JavaScript</option>
                    </select>
                </div>
                <div className="flex items-center gap-2">
                    {actionSlot}
                    <button
                        onClick={() => window.dispatchEvent(new CustomEvent('askSocratic', { detail: { text: `Can you review my code for potential optimizations or architectural flaws?\n\n\`\`\`${lang}\n${currentCode}\n\`\`\`` } }))}
                        className="px-4 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-2 bg-blue-600/10 text-blue-400 border border-blue-500/20 hover:bg-blue-600/20"
                    >
                        <Icon.Cpu className="w-3 h-3" />
                        Agent Review
                    </button>
                    <button
                        onClick={runCode}
                        disabled={isRunning}
                        className={`px-4 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-2
                            ${isRunning 
                                ? "bg-slate-700 text-slate-400 cursor-not-allowed" 
                                : "bg-green-600 hover:bg-green-500 text-white shadow-lg shadow-green-500/20 hover:shadow-green-500/40"}`}
                    >
                        {isRunning ? (
                            <>
                                <svg className="animate-spin h-3 w-3 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                </svg>
                                Running...
                            </>
                        ) : (
                            <>
                                <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                </svg>
                                Run Code
                            </>
                        )}
                    </button>
                </div>
            </div>

            {/* Split View: Editor & Output */}
            <div className="flex-1 flex flex-col md:flex-row h-[400px]">
                {/* Editor */}
                <div className="flex-1 relative bg-[#1e1e1e]">
                    <textarea
                        value={currentCode}
                        onChange={(e) => {
                            if (onChange) {
                                onChange(e.target.value);
                            } else {
                                setCode(e.target.value);
                            }
                        }}
                        onMouseUp={handleMouseUp}
                        onKeyUp={handleMouseUp}
                        spellCheck="false"
                        className="w-full h-full bg-transparent text-gray-200 font-mono text-sm p-4 resize-none focus:outline-none leading-relaxed"
                        style={{ tabSize: 4 }}
                        placeholder="// Write your code here..."
                    />
                    
                    {selection && (
                        <div 
                          className="fixed z-1000 bg-blue-600 text-white px-3 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-widest shadow-2xl flex items-center gap-2 cursor-pointer hover:bg-blue-500 transition-all active:scale-95 animate-in fade-in zoom-in"
                          style={{ left: selection.x, top: selection.y - 45 }}
                          onClick={askSocratic}
                        >
                           <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                               <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M13 10V3L4 14h7v7l9-11h-7z" />
                           </svg>
                           Explain with Socratic
                        </div>
                    )}
                </div>

                {/* Output Console */}
                <div className="h-1/3 md:h-full md:w-1/3 bg-black border-t md:border-t-0 md:border-l border-white/10 flex flex-col">
                    <div className="bg-slate-900 px-3 py-1.5 text-[10px] font-mono text-slate-500 uppercase tracking-widest border-b border-white/5">
                        Console Output
                    </div>
                    <pre className="flex-1 p-3 text-xs font-mono text-green-400 overflow-auto whitespace-pre-wrap selection:bg-green-500/30">
                        {output || <span className="text-slate-600 italic">Output will appear here...</span>}
                    </pre>
                </div>
            </div>

            <div className="border-t border-white/10 bg-slate-950/80 p-4">
                <div className="mb-2 flex items-center justify-between">
                    <span className="text-[10px] font-mono uppercase tracking-widest text-slate-500">Custom Input</span>
                    <span className="text-[10px] text-slate-600">Optional stdin for compiler runs</span>
                </div>
                <textarea
                    value={currentInput}
                    onChange={(e) => {
                        if (onStdinChange) {
                            onStdinChange(e.target.value);
                        } else {
                            setStdin(e.target.value);
                        }
                    }}
                    className="h-24 w-full rounded-xl border border-white/10 bg-black/40 p-3 font-mono text-xs text-slate-200 outline-none transition focus:border-cyan-500/40"
                    placeholder="Enter input that should be passed to stdin..."
                />
            </div>
        </div>
    );
};

export default CodePlayground;
