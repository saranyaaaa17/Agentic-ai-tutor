import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useAuth } from "../../context/AuthContext";
import { supabase } from "../../lib/supabase";
import AssistantFlow from "./AssistantFlow";

const FloatingAssistant = () => {
  const { user } = useAuth();
  const [profile, setProfile] = useState(null);
  const [mode, setMode] = useState("compact"); // 'compact' | 'expanded'

  useEffect(() => {
    if (!user) return;
    const fetchProfile = async () => {
      const { data } = await supabase.from("profiles").select("*").eq("id", user.id).single();
      if (data) setProfile(data);
    };
    fetchProfile();
  }, [user]);

  return (
    <>
      {/* Compact "Orb" Mode */}
      <AnimatePresence>
        {mode === "compact" && (
          <motion.div
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0, opacity: 0 }}
            className="fixed bottom-8 right-8 z-50 flex flex-col items-end gap-2 group"
          >
            {/* Tooltip */}
            <motion.div
              initial={{ x: 20, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              transition={{ delay: 1 }}
              className="bg-slate-900/90 backdrop-blur-md border border-white/10 px-3 py-1.5 rounded-lg text-xs font-medium text-cyan-400 mb-2 shadow-lg mr-1"
            >
              Ask AI Tutor
            </motion.div>

            {/* Glowing Orb Button */}
            <button
              onClick={() => setMode("expanded")}
              className="relative w-14 h-14 rounded-full flex items-center justify-center transition-transform hover:scale-105 active:scale-95 group/btn"
            >
              {/* Outer Glow Ring */}
              <div className="absolute inset-0 rounded-full bg-cyan-500/20 blur-md animate-pulse group-hover/btn:blur-xl transition-all" />
              <div className="absolute inset-0 rounded-full border border-cyan-500/30 group-hover/btn:border-cyan-400/60 transition-colors" />
              
              {/* Inner Core */}
              <div className="relative w-11 h-11 bg-slate-900 rounded-full border border-cyan-500/50 flex items-center justify-center overflow-hidden shadow-[0_0_15px_rgba(6,182,212,0.3)] bg-linear-to-b from-slate-800 to-slate-950">
                 
                 {/* Robot Icon */}
                 <svg className="w-6 h-6 text-cyan-400 drop-shadow-[0_0_5px_rgba(34,211,238,0.8)]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                 </svg>

                 {/* Eyes glow */}
                 <div className="absolute top-[38%] left-[35%] w-0.5 h-0.5 bg-cyan-200 rounded-full shadow-[0_0_4px_cyan]" />
                 <div className="absolute top-[38%] right-[35%] w-0.5 h-0.5 bg-cyan-200 rounded-full shadow-[0_0_4px_cyan]" />
              </div>
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Expanded "Command Center" Mode */}
      <AnimatePresence>
        {mode === "expanded" && (
          <>
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setMode("compact")}
              className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40"
            />

            {/* Main Panel */}
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="fixed inset-4 md:inset-auto md:bottom-8 md:right-8 md:w-[800px] md:h-[600px] bg-[#050B14] border border-cyan-500/30 rounded-3xl shadow-[0_0_50px_rgba(0,0,0,0.5)] z-50 flex overflow-hidden ring-1 ring-white/10"
            >
              
              {/* Decorative Background Elements */}
              <div className="absolute inset-0 pointer-events-none">
                 <div className="absolute top-[-20%] left-[-10%] w-[300px] h-[300px] bg-cyan-500/10 blur-[80px] rounded-full" />
                 <div className="absolute bottom-[-20%] right-[-10%] w-[300px] h-[300px] bg-purple-500/10 blur-[80px] rounded-full" />
              </div>

              {/* Sidebar: Agent Status */}
              <div className="w-64 bg-slate-900/50 border-r border-white/5 p-6 flex-col hidden md:flex backdrop-blur-md relative z-10">
                 <div className="flex items-center gap-3 mb-8">
                     <div className="w-8 h-8 rounded-lg bg-cyan-500/20 flex items-center justify-center text-cyan-400">
                        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                           <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 10l-2 1m0 0l-2-1m2 1v2.5M20 7l-2 1m2-1l-2-1m2 1v2.5M14 4l-2-1-2 1M4 7l2-1M4 7l2 1M4 7v2.5M12 21l-2-1m2 1l2-1m-2 1v-2.5M6 18l-2-1v-2.5M18 18l2-1v-2.5" />
                        </svg>
                     </div>
                     <span className="font-bold text-white tracking-tight">Agent Core</span>
                 </div>

                 <div className="space-y-4 flex-1">
                     <h3 className="text-xs font-mono text-slate-500 uppercase tracking-widest pl-1">Active Agents</h3>
                     <AgentStatusCard name="Evaluator" status="Monitoring" color="bg-green-500" />
                     <AgentStatusCard name="Teacher" status="Ready" color="bg-yellow-500" />
                     <AgentStatusCard name="Strategy" status="Standby" color="bg-purple-500" />
                     <AgentStatusCard name="Knowledge" status="Idle" color="bg-blue-500" />
                 </div>

                 <div className="pt-6 border-t border-white/5">
                    <div className="flex items-center justify-between text-xs text-slate-400">
                        <span>Load</span>
                        <span className="text-cyan-400">12%</span>
                    </div>
                    <div className="w-full h-1 bg-slate-800 rounded-full mt-2 overflow-hidden">
                        <div className="h-full w-[12%] bg-cyan-500" />
                    </div>
                 </div>
              </div>

              {/* Main Chat Area */}
              <div className="flex-1 flex flex-col relative z-10 bg-transparent">
                  <div className="h-14 border-b border-white/5 flex items-center justify-between px-6 bg-slate-900/20">
                      <span className="text-sm font-medium text-slate-300">Diagnostic Session</span>
                      <button onClick={() => setMode("compact")} className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-white/5 text-slate-400 hover:text-white transition">
                          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                          </svg>
                      </button>
                  </div>
                  
                  <div className="flex-1 overflow-hidden">
                      <AssistantFlow user={user} profile={profile} />
                  </div>
              </div>

            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
};

const AgentStatusCard = ({ name, status, color }) => (
    <div className="flex items-center justify-between p-3 rounded-xl bg-white/5 border border-white/5 border-l-2 border-l-transparent hover:border-l-cyan-400 transition-all group">
         <div className="flex items-center gap-3">
             <div className={`w-2 h-2 rounded-full ${color} animate-pulse`} />
             <span className="text-sm text-slate-200 font-medium">{name}</span>
         </div>
         <span className={`text-[10px] font-mono px-2 py-0.5 rounded bg-slate-800 text-slate-400`}>{status}</span>
    </div>
);

export default FloatingAssistant;
