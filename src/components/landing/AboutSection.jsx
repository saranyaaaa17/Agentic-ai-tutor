import { motion } from "framer-motion";

const AboutSection = () => {
  return (
    <section id="about" className="py-28 px-6 bg-[#050B14] relative">
      {/* Background radial fade */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-slate-800/20 blur-[100px] rounded-full pointer-events-none" />

      <div className="max-w-7xl mx-auto relative z-10">

        <motion.div
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          viewport={{ once: true }}
          className="text-center max-w-3xl mx-auto mb-20"
        >
          <div className="text-cyan-400 font-mono text-sm tracking-widest uppercase mb-4">Why Agentic AI?</div>
          <h2 className="text-4xl md:text-5xl font-bold tracking-tight text-white mb-6">
            Built by humans,<br /> 
            <span className="text-slate-400">orchestrated by intelligence.</span>
          </h2>
          <p className="text-lg text-slate-400">
             Traditional learning is static. We built a system that evolves with you, utilizing specialized agents to mimic the effectiveness of a personal human tutor.
          </p>
        </motion.div>

        {/* Bento Grid */}
        <div className="grid md:grid-cols-3 gap-6">

          {/* Col 1 */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
             whileInView={{ opacity: 1, x: 0 }}
             transition={{ duration: 0.5, delay: 0.1 }}
             viewport={{ once: true }} 
             className="md:col-span-2 bg-slate-900/50 backdrop-blur-sm border border-white/5 rounded-3xl p-10 hover:border-cyan-500/30 transition-all group relative overflow-hidden"
          >
             <div className="absolute top-0 right-0 p-10 opacity-10 group-hover:opacity-20 transition-opacity">
                <svg className="w-48 h-48" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                   <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={0.5} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                </svg>
             </div>
             <div className="relative z-10">
                <div className="w-12 h-12 rounded-xl bg-cyan-500/10 flex items-center justify-center mb-6 text-cyan-400">
                    <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19.428 15.428a2 2 0 00-1.022-.547l-2.384-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" />
                    </svg>
                </div>
                <h3 className="text-2xl font-bold text-white mb-4">Multi-Agent Architecture</h3>
                <p className="text-slate-400 leading-relaxed max-w-lg">
                   Instead of a single bot trying to do everything, we deploy specialized agents (Teacher, Evaluator, Strategy) that collaborate to solve your learning gaps.
                </p>
             </div>
          </motion.div>

           {/* Col 2 - Tall Card */}
           <motion.div
             initial={{ opacity: 0, y: 20 }}
             whileInView={{ opacity: 1, y: 0 }}
             transition={{ duration: 0.5, delay: 0.2 }}
             viewport={{ once: true }} 
             className="md:row-span-2 bg-slate-900/50 backdrop-blur-sm border border-white/5 rounded-3xl p-10 hover:border-purple-500/30 transition-all group relative overflow-hidden"
          >
              <div className="absolute bottom-0 right-0 w-full h-1/2 bg-linear-to-t from-purple-500/10 to-transparent opacity-50" />
              <div className="relative z-10">
                  <div className="w-12 h-12 rounded-xl bg-purple-500/10 flex items-center justify-center mb-6 text-purple-400">
                     <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                     </svg>
                  </div>
                  <h3 className="text-2xl font-bold text-white mb-4">Adaptive Intelligence</h3>
                  <p className="text-slate-400 leading-relaxed mb-6">
                     The system dynamically adjusts difficulty based on your real-time performance.
                  </p>
                  <ul className="space-y-4">
                      {["Real-time feedback", "Difficulty modulation", "Personalized path"].map((item, i) => (
                          <li key={i} className="flex items-center gap-3 text-slate-300 text-sm font-medium p-3 rounded-lg bg-white/5 border border-white/5">
                              <div className="w-1.5 h-1.5 rounded-full bg-purple-400" />
                              {item}
                          </li>
                      ))}
                  </ul>
              </div>
          </motion.div>

          {/* Col 3 - Bottom Left */}
          <motion.div
             initial={{ opacity: 0, x: -20 }}
             whileInView={{ opacity: 1, x: 0 }}
             transition={{ duration: 0.5, delay: 0.3 }}
             viewport={{ once: true }} 
             className="md:col-span-2 bg-slate-900/50 backdrop-blur-sm border border-white/5 rounded-3xl p-10 hover:border-green-500/30 transition-all group relative overflow-hidden"
          >
              <div className="flex items-center gap-6">
                  <div className="w-12 h-12 rounded-xl bg-green-500/10 flex items-center justify-center text-green-400 shrink-0">
                     <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
                     </svg>
                  </div>
                  <div>
                      <h3 className="text-xl font-bold text-white mb-2">Explicit Learner State</h3>
                      <p className="text-slate-400 text-sm">
                          We track your knowledge state explicitly — differentiating between a "silly mistake" and a "conceptual gap".
                      </p>
                  </div>
              </div>
          </motion.div>

        </div>

      </div>
    </section>
  );
};

export default AboutSection;
