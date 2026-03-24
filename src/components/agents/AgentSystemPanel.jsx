import { useEffect, useState } from "react";

const statusTone = {
  online: "text-emerald-300 border-emerald-500/20 bg-emerald-500/10",
  offline: "text-rose-300 border-rose-500/20 bg-rose-500/10",
  error: "text-amber-300 border-amber-500/20 bg-amber-500/10",
  disabled: "text-slate-300 border-white/10 bg-white/5"
};

const AgentSystemPanel = ({ compact = false, className = "" }) => {
  const [status, setStatus] = useState(null);
  const [error, setError] = useState("");

  useEffect(() => {
    let active = true;

    const API_BASE_URL = import.meta.env.VITE_API_URL || (typeof window !== "undefined" && window.location.hostname === "localhost" ? "http://localhost:8000" : "");

    const loadStatus = async () => {
      try {
        const response = await fetch(`${API_BASE_URL}/api/status`);
        if (!response.ok) {
          throw new Error("Status endpoint unavailable");
        }
        const data = await response.json();
        if (active) {
          setStatus(data);
          setError("");
        }
      } catch (err) {
        if (active) {
          setError(err.message || "Unable to load agent status");
        }
      }
    };

    loadStatus();
    return () => {
      active = false;
    };
  }, []);

  const agents = status?.agents || [];
  const orchestration = status?.orchestration;

  return (
    <section className={`rounded-3xl border border-white/10 bg-slate-900/60 backdrop-blur-xl ${compact ? "p-5" : "p-7"} ${className}`}>
      <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
        <div>
          <p className="text-[10px] font-black uppercase tracking-[0.34em] text-cyan-400">Agent Architecture</p>
          <h3 className={`${compact ? "text-xl" : "text-2xl"} mt-2 font-black text-white`}>
            Live Swarm Visibility
          </h3>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-400">
            This panel proves the prototype is using distinct agents for teaching, learner modeling, evaluation, gap diagnosis, and strategy generation.
          </p>
        </div>
        <div className={`inline-flex items-center gap-2 rounded-full border px-4 py-2 text-[11px] font-black uppercase tracking-[0.24em] ${statusTone[orchestration?.n8n_status || "disabled"]}`}>
          <span className="h-2 w-2 rounded-full bg-current opacity-80" />
          N8N {orchestration?.n8n_status || "unknown"}
        </div>
      </div>

      {error ? (
        <div className="mt-5 rounded-2xl border border-rose-500/20 bg-rose-500/10 px-4 py-3 text-sm text-rose-200">
          {error}
        </div>
      ) : null}

      <div className={`mt-6 grid gap-4 ${compact ? "md:grid-cols-2 xl:grid-cols-3" : "md:grid-cols-2 xl:grid-cols-5"}`}>
        {agents.map((agent) => (
          <div key={agent.id} className="rounded-2xl border border-white/8 bg-[#0b1324] p-4">
            <div className="flex items-center justify-between gap-3">
              <h4 className="text-sm font-black text-white">{agent.label}</h4>
              <span className={`rounded-full border px-2.5 py-1 text-[10px] font-black uppercase tracking-widest ${statusTone[agent.status] || statusTone.disabled}`}>
                {agent.status}
              </span>
            </div>
            <p className="mt-3 text-xs leading-6 text-slate-400">{agent.role}</p>
          </div>
        ))}
      </div>

      <div className={`mt-6 grid gap-6 ${compact ? "lg:grid-cols-1" : "lg:grid-cols-[1.2fr_0.8fr]"}`}>
        <div className="rounded-2xl border border-white/8 bg-[#09101f] p-5">
          <div className="flex items-center justify-between gap-3">
            <p className="text-[10px] font-black uppercase tracking-[0.28em] text-slate-400">Workflow Proof</p>
            <span className="text-xs font-black text-cyan-400">{orchestration?.engine || "TutorOrchestrator"}</span>
          </div>
          <div className="mt-5 space-y-4">
            {(orchestration?.workflow_steps || []).map((step, index) => (
              <div key={`${step.agent}-${index}`} className="flex gap-4">
                <div className="flex flex-col items-center">
                  <div className="flex h-8 w-8 items-center justify-center rounded-full border border-cyan-500/20 bg-cyan-500/10 text-[11px] font-black text-cyan-300">
                    {index + 1}
                  </div>
                  {index < (orchestration?.workflow_steps?.length || 0) - 1 ? (
                    <div className="mt-2 h-8 w-px bg-white/10" />
                  ) : null}
                </div>
                <div className="pt-1">
                  <p className="text-sm font-black text-white">{step.agent}</p>
                  <p className="mt-1 text-xs leading-6 text-slate-400">{step.label}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="rounded-2xl border border-white/8 bg-[#09101f] p-5">
          <p className="text-[10px] font-black uppercase tracking-[0.28em] text-slate-400">Prototype Notes</p>
          <div className="mt-4 space-y-3 text-sm leading-6 text-slate-300">
            <p>Teacher Agent creates explanations, quizzes, and challenge prompts.</p>
            <p>Student Agent is represented by the learner profile and personalization memory.</p>
            <p>Evaluator and Knowledge Gap agents work during answer review and batch analysis.</p>
            <p>Strategy Agent generates the roadmap and recommended resource plan.</p>
            <p>N8N state is shown separately so the orchestration story is visible in the UI.</p>
          </div>
        </div>
      </div>
    </section>
  );
};

export default AgentSystemPanel;
