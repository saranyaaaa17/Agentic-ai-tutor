import { useState } from "react";

const FloatingCalculator = () => {
  const [open, setOpen] = useState(false);
  const [expression, setExpression] = useState("");
  const [result, setResult] = useState("");

  const appendValue = (value) => {
    setExpression((current) => `${current}${value}`);
  };

  const clearAll = () => {
    setExpression("");
    setResult("");
  };

  const evaluateExpression = () => {
    try {
      const safe = expression.replace(/[^0-9+\-*/().% ]/g, "");
      const computed = Function(`"use strict"; return (${safe || 0})`)();
      setResult(String(computed));
    } catch {
      setResult("Invalid expression");
    }
  };

  return (
    <div className="fixed bottom-8 right-8 z-40">
      {open ? (
        <div className="w-80 rounded-3xl border border-cyan-500/20 bg-slate-950/95 p-5 shadow-2xl shadow-cyan-500/10 backdrop-blur-xl">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-[10px] font-black uppercase tracking-[0.28em] text-cyan-400">Quick Calculator</p>
              <p className="mt-1 text-xs text-slate-500">For aptitude and quantitative rounds</p>
            </div>
            <button onClick={() => setOpen(false)} className="rounded-full border border-white/10 px-3 py-1 text-xs font-black text-slate-300 hover:bg-white/5">
              Close
            </button>
          </div>

          <div className="mt-4 rounded-2xl border border-white/8 bg-[#08101d] p-4">
            <div className="min-h-[52px] break-all text-right font-mono text-lg text-white">{expression || "0"}</div>
            <div className="mt-2 min-h-[24px] text-right font-mono text-sm text-cyan-300">{result}</div>
          </div>

          <div className="mt-4 grid grid-cols-4 gap-2">
            {["7", "8", "9", "/", "4", "5", "6", "*", "1", "2", "3", "-", "0", ".", "%", "+"].map((value) => (
              <button
                key={value}
                onClick={() => appendValue(value)}
                className="rounded-2xl border border-white/8 bg-white/5 px-3 py-3 text-sm font-black text-white transition hover:bg-white/10"
              >
                {value}
              </button>
            ))}
            <button onClick={clearAll} className="col-span-2 rounded-2xl border border-rose-500/20 bg-rose-500/10 px-3 py-3 text-sm font-black text-rose-200">
              Clear
            </button>
            <button onClick={() => appendValue("(")} className="rounded-2xl border border-white/8 bg-white/5 px-3 py-3 text-sm font-black text-white">
              (
            </button>
            <button onClick={() => appendValue(")")} className="rounded-2xl border border-white/8 bg-white/5 px-3 py-3 text-sm font-black text-white">
              )
            </button>
          </div>

          <button onClick={evaluateExpression} className="mt-4 w-full rounded-2xl bg-cyan-500 px-4 py-3 text-sm font-black text-slate-950 transition hover:bg-cyan-400">
            Evaluate
          </button>
        </div>
      ) : (
        <button
          onClick={() => setOpen(true)}
          className="rounded-full border border-cyan-500/30 bg-slate-950/90 px-5 py-3 text-xs font-black uppercase tracking-[0.24em] text-cyan-300 shadow-2xl shadow-cyan-500/10 backdrop-blur-xl"
        >
          Calculator
        </button>
      )}
    </div>
  );
};

export default FloatingCalculator;
