import { motion } from "framer-motion";
import { Link } from "react-router-dom";

const EcosystemSection = () => {
  return (
    <section className="py-32 px-6 relative overflow-hidden bg-slate-950">
      
      {/* ──── The "Agentic" Background Pattern (Low Transparency) ──── */}
      <div className="absolute inset-0 pointer-events-none select-none overflow-hidden opacity-20">
        {/* Animated Grid lines */}
        <div className="absolute inset-0 bg-[radial-gradient(#1e293b_1px,transparent_1px)] bg-size-[40px_40px] mask-[radial-gradient(ellipse_50%_50%_at_50%_50%,#000_70%,transparent_100%)]" />
        
        {/* Floating AI Agent Outlines */}
        <div className="absolute inset-0 flex items-center justify-center">
            {[...Array(6)].map((_, i) => (
                <motion.div
                    key={i}
                    animate={{ 
                        y: [0, -20, 0],
                        opacity: [0.05, 0.1, 0.05]
                    }}
                    transition={{ 
                        duration: 5 + i, 
                        repeat: Infinity, 
                        ease: "easeInOut",
                        delay: i * 0.5
                    }}
                    className="absolute"
                    style={{
                        left: `${15 + i * 15}%`,
                        top: `${20 + (i % 3) * 20}%`,
                    }}
                >
                    <svg className="w-48 h-48 text-cyan-500/10" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={0.5}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M9 3v2m6-2v2M9 19v2m6-2v2M5 9H3m2 6H3m18-6h-2m2 6h-2M7 19h10a2 2 0 002-2V7a2 2 0 00-2-2H7a2 2 0 00-2 2v10a2 2 0 002 2zM9 9h6v6H9V9z" />
                    </svg>
                </motion.div>
            ))}
        </div>
      </div>

      <div className="max-w-4xl mx-auto text-center relative z-10">
        <motion.div
           initial={{ opacity: 0, scale: 0.95 }}
           whileInView={{ opacity: 1, scale: 1 }}
           transition={{ duration: 0.8 }}
           viewport={{ once: true }}
        >
          <div className="text-cyan-400 font-bold uppercase tracking-[0.3em] text-xs mb-6">
            Smart Learning
          </div>
          <h2 className="text-4xl md:text-6xl font-black text-white mb-8 tracking-tighter leading-none">
            An AI Assistant <br />At Your <span className="text-cyan-500">Service.</span>
          </h2>
          <p className="text-lg text-slate-400 mb-12 leading-relaxed max-w-2xl mx-auto">
            Our technology simplifies everything for you. From identifying what to study next to giving you the best resources, we make sure your time is spent learning effectively.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <Link to="/signup" className="px-10 py-4 bg-cyan-600 hover:bg-cyan-500 text-white font-bold rounded-2xl transition-all shadow-xl shadow-cyan-600/20 active:scale-95">
                Start Learning Now
              </Link>
              <button className="px-10 py-4 bg-white/5 border border-white/10 text-white font-bold rounded-2xl hover:bg-white/10 transition-all">
                The Architect's Roadmap
              </button>
          </div>
        </motion.div>
      </div>

      {/* Finishing Touch: Interconnecting lines between floating nodes */}
      <svg className="absolute inset-0 w-full h-full pointer-events-none opacity-5">
         <line x1="20%" y1="30%" x2="80%" y2="70%" stroke="#06b6d4" strokeWidth="1" strokeDasharray="5,5" />
         <line x1="80%" y1="20%" x2="20%" y2="80%" stroke="#06b6d4" strokeWidth="1" strokeDasharray="5,5" />
      </svg>
    </section>
  );
};

export default EcosystemSection;
