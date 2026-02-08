import { motion } from "framer-motion";
import { Link } from "react-router-dom";

const HeroSection = () => {
  return (
    <section className="relative w-full max-w-7xl mx-auto px-6 grid md:grid-cols-2 gap-12 items-center min-h-[600px]">
      
      {/* Background Glow for Hero */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-cyan-500/20 rounded-full blur-[120px] pointer-events-none -z-10" />

      {/* Text Content - Centered vertically within left column */}
      <motion.div 
          initial={{ opacity: 0, x: -50 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.8, ease: "easeOut" }}
          className="relative z-10 flex flex-col justify-center items-start h-full -mt-16"
      >
        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-cyan-500/30 bg-cyan-500/10 text-cyan-400 text-sm font-mono mb-8 backdrop-blur-md">
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-cyan-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-cyan-500"></span>
          </span>
          Agentic AI Powered Architecture
        </div>

        <h1 className="text-5xl md:text-7xl font-bold tracking-tight leading-tight mb-6 text-white">
          Your learning.<br />
          <span className="text-transparent bg-clip-text bg-linear-to-r from-cyan-400 via-blue-500 to-purple-600 animate-gradient-x">
            Orchestrated.
          </span>
        </h1>

        <p className="text-lg text-slate-400 mb-10 leading-relaxed max-w-lg">
           A coordinated ecosystem of intelligent agents that evaluate, adapt, and personalize your mastery journey in real-time.
        </p>

        <div className="flex flex-wrap gap-4">
          <Link to="/start-learning" className="group relative px-8 py-4 bg-cyan-500 hover:bg-cyan-400 text-black font-bold rounded-xl transition-all shadow-[0_0_20px_rgba(34,211,238,0.3)] hover:shadow-[0_0_40px_rgba(34,211,238,0.5)] transform hover:-translate-y-1">
             Start Learning
          </Link>
          <a 
            href="#features" 
            className="px-8 py-4 rounded-xl border border-white/10 hover:bg-white/5 transition-all text-white font-medium hover:border-cyan-500/50 hover:text-cyan-400"
          >
             Explore Features
          </a>
        </div>
      </motion.div>

      {/* Visual / Graphic - Original Abstract Animation */}
      <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 1, delay: 0.2 }}
          className="relative hidden md:flex justify-center items-center h-[500px]"
      >
           {/* Abstract Agent UI representation */}
           <div className="relative w-full h-full flex items-center justify-center perspective-[1000px]">
              <motion.div 
                   animate={{ rotateX: 15, rotateY: 5 }}
                   transition={{ duration: 10, repeat: Infinity, repeatType: "reverse", ease: "easeInOut" }}
                   className="relative w-full h-full flex items-center justify-center transform-3d"
              >
              {/* Rings */}
              <motion.div 
                  animate={{ rotate: 360 }}
                  transition={{ duration: 30, repeat: Infinity, ease: "linear" }}
                  className="absolute w-[400px] h-[400px] rounded-full border border-white/5 border-dashed"
              />
              <motion.div 
                  animate={{ rotate: -360 }}
                  transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
                  className="absolute w-[280px] h-[280px] rounded-full border border-cyan-500/10"
              />
              
              {/* Central Core */}
              <div className="relative w-20 h-20 bg-slate-900 rounded-full border border-cyan-500/50 flex items-center justify-center shadow-[0_0_50px_rgba(6,182,212,0.3)] z-20">
                  <div className="w-10 h-10 bg-cyan-400 rounded-full blur-md opacity-50 absolute" />
                  <svg className="w-8 h-8 text-cyan-400 relative z-10" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                  </svg>
              </div>

              {/* Floating Agent Cards */}
              <motion.div 
                  animate={{ y: [0, -15, 0], x: [0, 5, 0] }}
                  transition={{ duration: 5, repeat: Infinity, ease: "easeInOut" }}
                  className="absolute top-0 right-4 p-4 bg-slate-900/80 backdrop-blur-md rounded-2xl border border-white/10 hover:border-cyan-500/50 transition-colors shadow-2xl z-30 w-48 group"
              >
                  <div className="flex items-center gap-2 mb-2">
                       <div className="w-2 h-2 rounded-full bg-green-500" />
                       <div className="text-sm text-slate-200 font-bold uppercase group-hover:text-cyan-400 transition-colors">Evaluator</div>
                  </div>
                  <div className="h-1.5 w-full bg-slate-800 rounded-full overflow-hidden mb-1">
                      <motion.div 
                          animate={{ width: ["0%", "80%", "80%"] }}
                          transition={{ duration: 2, repeat: Infinity, repeatDelay: 3 }}
                          className="h-full bg-green-500" 
                      />
                  </div>
                  <div className="text-[10px] text-slate-500 font-mono">Analyzing code complexity...</div>
              </motion.div>

              <motion.div 
                  animate={{ y: [0, 20, 0], x: [0, -5, 0] }}
                  transition={{ duration: 6, repeat: Infinity, ease: "easeInOut", delay: 1 }}
                  className="absolute bottom-10 left-0 p-4 bg-slate-900/80 backdrop-blur-md rounded-2xl border border-white/10 hover:border-cyan-500/50 transition-colors shadow-2xl z-30 w-52 group"
              >
                  <div className="flex items-center gap-2 mb-2">
                       <div className="w-2 h-2 rounded-full bg-purple-500" />
                       <div className="text-sm text-slate-200 font-bold uppercase group-hover:text-cyan-400 transition-colors">Strategy</div>
                  </div>
                  <div className="flex gap-1 mb-2">
                      {[1,2,3].map(i => (
                          <div key={i} className="h-6 flex-1 bg-slate-800 rounded-md animate-pulse" style={{ animationDelay: `${i * 0.2}s`}} />
                      ))}
                  </div>
                  <div className="text-[10px] text-slate-500 font-mono">Optimizing learning path...</div>
              </motion.div>

              <motion.div 
                  animate={{ y: [0, -10, 0], x: [0, -5, 0] }}
                  transition={{ duration: 7, repeat: Infinity, ease: "easeInOut", delay: 0.5 }}
                  className="absolute top-10 left-4 p-3 bg-slate-900/80 backdrop-blur-md rounded-2xl border border-white/10 hover:border-cyan-500/50 transition-colors shadow-2xl z-20 w-44 opacity-90 group"
              >
                  <div className="flex items-center gap-2 mb-2">
                       <div className="w-2 h-2 rounded-full bg-yellow-500" />
                       <div className="text-sm text-slate-200 font-bold uppercase group-hover:text-cyan-400 transition-colors">Teacher</div>
                  </div>
                  <div className="space-y-1">
                      <div className="h-1.5 w-3/4 bg-slate-800 rounded-full" />
                      <div className="h-1.5 w-1/2 bg-slate-800 rounded-full" />
                  </div>
                  <div className="text-[10px] text-slate-500 font-mono mt-1">Explaining concepts...</div>
              </motion.div>

               <motion.div 
                  animate={{ y: [0, 15, 0], x: [0, 10, 0] }}
                  transition={{ duration: 8, repeat: Infinity, ease: "easeInOut", delay: 1.5 }}
                  className="absolute bottom-20 right-[-10px] p-3 bg-slate-900/80 backdrop-blur-md rounded-2xl border border-white/10 hover:border-cyan-500/50 transition-colors shadow-2xl z-20 w-44 opacity-90 group"
              >
                  <div className="flex items-center gap-2 mb-2">
                       <div className="w-2 h-2 rounded-full bg-blue-500" />
                       <div className="text-sm text-slate-200 font-bold uppercase group-hover:text-cyan-400 transition-colors">Knowledge</div>
                  </div>
                  <div className="flex gap-1 justify-between px-1">
                      <div className="w-2 h-2 rounded-full bg-blue-500/20" />
                      <div className="w-2 h-2 rounded-full bg-blue-500/50" />
                      <div className="w-2 h-2 rounded-full bg-blue-500/80" />
                      <div className="w-2 h-2 rounded-full bg-blue-500" />
                  </div>
                  <div className="text-[10px] text-slate-500 font-mono mt-2">Retrieving docs...</div>
              </motion.div>
              </motion.div>
           </div>
      </motion.div>

    </section>
  );
};

export default HeroSection;
