import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useAuth } from "../../context/AuthContext";
import { supabase } from "../../lib/supabase";
import AssistantFlow from "./AssistantFlow";
import AssistantChat from "./AssistantChat";

const FloatingAssistant = () => {
  const { user } = useAuth();
  const [profile, setProfile] = useState(null);
  const [mode, setMode] = useState("compact"); // 'compact' | 'expanded'
  const [activeTab, setActiveTab] = useState("chat"); // Default back to Diagnostic Chat

  useEffect(() => {
    if (!user) return;
    const fetchProfile = async () => {
      const { data } = await supabase.from("profiles").select("*").eq("id", user.id).maybeSingle();
      if (data) setProfile(data);
    };
    fetchProfile();
  }, [user]);

  if (!user) return null;

  return (
    <>
      <AnimatePresence>
        {mode === "compact" && (
          <motion.div
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0, opacity: 0 }}
            className="fixed bottom-8 right-8 z-50 flex flex-col items-end gap-2 group"
          >
            <motion.div
              initial={{ x: 20, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              transition={{ delay: 1 }}
              className="bg-slate-900/90 backdrop-blur-md border border-white/10 px-3 py-1.5 rounded-lg text-xs font-medium text-cyan-400 mb-2 shadow-lg mr-1"
            >
              Get Help
            </motion.div>

            <button
              onClick={() => setMode("expanded")}
              className="relative w-14 h-14 rounded-full flex items-center justify-center transition-transform hover:scale-105 active:scale-95 group/btn shadow-2xl"
            >
              <div className="absolute inset-0 rounded-full bg-cyan-500/20 blur-md animate-pulse group-hover/btn:blur-xl transition-all" />
              <div className="absolute inset-0 rounded-full border border-cyan-500/30 group-hover/btn:border-cyan-400/60 transition-colors" />
              
              <div 
                className="relative w-11 h-11 bg-slate-900 rounded-full border border-cyan-500/50 flex items-center justify-center overflow-hidden shadow-[0_0_15px_rgba(6,182,212,0.3)] bg-linear-to-b from-slate-800 to-slate-950 transform-3d"
                style={{ transform: "rotateX(15deg) rotateY(-10deg)" }}
              >
                 <svg className="w-6 h-6 text-cyan-400 drop-shadow-[0_0_5px_rgba(34,211,238,0.8)]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                 </svg>
                 <div className="absolute top-[38%] left-[35%] w-0.5 h-0.5 bg-cyan-200 rounded-full shadow-[0_0_4px_cyan]" />
                 <div className="absolute top-[38%] right-[35%] w-0.5 h-0.5 bg-cyan-200 rounded-full shadow-[0_0_4px_cyan]" />
              </div>
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {mode === "expanded" && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setMode("compact")}
              className="fixed inset-0 bg-black/60 backdrop-blur-sm"
            />

            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="relative z-10 w-full max-w-7xl h-[85vh] flex rounded-[28px] overflow-hidden bg-[#050B14] border border-cyan-500/30 shadow-2xl ring-1 ring-white/10"
            >
              {/* Decorative Background */}
              <div className="absolute inset-0 pointer-events-none">
                 <div className="absolute top-[-20%] left-[-10%] w-[400px] h-[400px] bg-cyan-500/10 blur-[100px] rounded-full" />
                 <div className="absolute bottom-[-20%] right-[-10%] w-[400px] h-[400px] bg-purple-500/10 blur-[100px] rounded-full" />
              </div>

              {/* Sidebar */}
              <div className="w-64 bg-slate-900/50 border-r border-white/5 p-6 flex-col hidden lg:flex backdrop-blur-md relative z-10">
                 <div className="rounded-3xl border border-cyan-500/10 bg-[radial-gradient(circle_at_top,rgba(34,211,238,0.12),transparent_55%),rgba(255,255,255,0.02)] p-4 mb-8">
                 <div className="flex items-center gap-3">
                     <div className="w-10 h-10 rounded-xl bg-cyan-500/20 flex items-center justify-center text-cyan-400 border border-cyan-500/30">
                        <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                           <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 10l-2 1m0 0l-2-1m2 1v2.5M20 7l-2 1m2-1l-2-1m2 1v2.5M14 4l-2-1-2 1M4 7l2-1M4 7l2 1M4 7v2.5M12 21l-2-1m2 1l2-1m-2 1v-2.5M6 18l-2-1v-2.5M18 18l2-1v-2.5" />
                        </svg>
                     </div>
                     <div className="flex flex-col">
                        <span className="font-bold text-white tracking-tight leading-none text-lg">AI Assistant</span>
                        <span className="text-[10px] text-cyan-400/60 font-mono tracking-tighter mt-1">Guided study cockpit</span>
                     </div>
                 </div>
                 <p className="mt-3 text-xs leading-6 text-slate-400">Use the Socratic flow for guided reasoning or switch to tutor studio for direct teach/evaluate actions.</p>
                 </div>

                 <div className="space-y-3 flex-1">
                     <h3 className="text-xs font-mono text-slate-500 uppercase tracking-widest pl-1 mb-4">Capabilities</h3>
                     <AgentStatusCard name="Socratic Coaching" status="Active" color="bg-cyan-500" />
                     <AgentStatusCard name="Assessment Review" status="Real-time" color="bg-green-500" />
                     <AgentStatusCard name="Roadmap Guidance" status="Ready" color="bg-purple-500" />
                     <AgentStatusCard name="Resource Lookup" status="Standby" color="bg-slate-600" />
                 </div>

                 <div className="pt-6 border-t border-white/5">
                    <div className="flex items-center justify-between text-[11px] text-slate-400 mb-2">
                        <span className="font-mono uppercase">System Status</span>
                        <span className="text-cyan-400 font-bold">Optimal</span>
                    </div>
                    <div className="w-full h-1.5 bg-slate-800 rounded-full overflow-hidden border border-white/5">
                        <div className="h-full w-full bg-cyan-500 shadow-[0_0_10px_rgba(6,182,212,0.5)]" />
                    </div>
                 </div>
              </div>

              {/* Main Area */}
              <div className="flex-1 flex flex-col relative z-10 bg-transparent w-full">
                  <div className="h-16 border-b border-white/5 flex items-center justify-between px-8 bg-slate-900/20 shrink-0">
                      <div className="flex gap-10 h-full">
                          <button 
                            onClick={() => setActiveTab("chat")}
                            className={`text-sm font-semibold transition-all border-b-2 px-1 h-full tracking-wide uppercase flex items-center ${activeTab === 'chat' ? 'text-cyan-400 border-cyan-400' : 'text-slate-500 border-transparent hover:text-white'}`}
                          >
                            Socratic Chat
                          </button>
                          <button 
                            onClick={() => setActiveTab("teacher")}
                            className={`text-sm font-semibold transition-all border-b-2 px-1 h-full tracking-wide uppercase flex items-center ${activeTab === 'teacher' ? 'text-cyan-400 border-cyan-400' : 'text-slate-500 border-transparent hover:text-white'}`}
                          >
                            Tutor Studio
                          </button>
                      </div>
                      <button onClick={() => setMode("compact")} className="w-10 h-10 flex items-center justify-center rounded-xl hover:bg-white/5 text-slate-400 hover:text-white transition-all group">
                          <svg className="w-6 h-6 group-hover:scale-110 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                          </svg>
                      </button>
                  </div>
                  
                  <div className="flex-1 overflow-hidden w-full relative">
                      {activeTab === "chat" ? (
                          <AssistantFlow user={user} profile={profile} />
                      ) : (
                          <AssistantChat />
                      )}
                  </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </>
  );
};

const AgentStatusCard = ({ name, status, color }) => (
    <div className="flex items-center justify-between p-3.5 rounded-2xl bg-white/5 border border-white/5 border-l-2 border-l-transparent hover:border-l-cyan-400 hover:bg-white/10 transition-all cursor-default group">
         <div className="flex items-center gap-3">
             <div className={`w-2 h-2 rounded-full ${color} shadow-[0_0_8px_${color.replace('bg-', '')}] animate-pulse`} />
             <span className="text-[13px] text-slate-200 font-bold tracking-tight">{name}</span>
         </div>
         <span className={`text-[9px] font-mono px-2 py-0.5 rounded-md bg-slate-800 text-slate-400 font-bold uppercase`}>{status}</span>
    </div>
);

export default FloatingAssistant;
