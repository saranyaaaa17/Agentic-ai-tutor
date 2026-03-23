
import React, { useState } from 'react';
import CodePlayground from '../components/CodePlayground';

const CodePage = () => {
    return (
        <div className="min-h-screen bg-[#050B14] text-white p-8">
            <div className="max-w-6xl mx-auto">
                <h1 className="text-4xl font-bold mb-4 bg-clip-text text-transparent bg-linear-to-r from-green-400 to-blue-500">
                    AI Coding Playground
                </h1>
                <p className="text-slate-400 mb-8 max-w-2xl">
                    Write, compile, and execute code instantly. Supports Python and JavaScript in the current local environment.
                    Test your logic here before answering assessment questions.
                </p>

                <div className="h-[600px] border border-white/10 rounded-2xl overflow-hidden shadow-2xl">
                    <CodePlayground 
                        language="python" 
                        initialCode={`# Welcome to AI Tutor Python Sandbox\n\ndef fibonacci(n):\n    if n <= 1:\n        return n\n    else:\n        return(fibonacci(n-1) + fibonacci(n-2))\n\n# Calculate first 10 numbers\nfor i in range(10):\n    print(f"Fib({i}) = {fibonacci(i)}")`} 
                    />
                </div>

                <div className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div className="bg-slate-900/50 p-6 rounded-xl border border-white/5 hover:border-green-500/30 transition-all">
                        <h3 className="text-green-400 font-bold mb-2">Real-time Compilation</h3>
                        <p className="text-slate-400 text-sm">Powered by Piston execution engine for instant feedback.</p>
                    </div>
                    <div className="bg-slate-900/50 p-6 rounded-xl border border-white/5 hover:border-blue-500/30 transition-all">
                        <h3 className="text-blue-400 font-bold mb-2">Available Runtimes</h3>
                        <p className="text-slate-400 text-sm">Switch between Python and JavaScript seamlessly.</p>
                    </div>
                    <div className="bg-slate-900/50 p-6 rounded-xl border border-white/5 hover:border-purple-500/30 transition-all">
                        <h3 className="text-purple-400 font-bold mb-2">Secure Sandbox</h3>
                        <p className="text-slate-400 text-sm">Code runs in isolated containers for safety and reliability.</p>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default CodePage;
