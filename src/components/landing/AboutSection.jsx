import { motion } from "framer-motion";

const AboutSection = () => {
  return (
    <section id="about" className="py-20 px-6 bg-[#050B14] relative">
      {/* Subtle background */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[400px] h-[400px] bg-cyan-500/5 blur-[100px] rounded-full pointer-events-none" />

      <div className="max-w-6xl mx-auto relative z-10">

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          viewport={{ once: true }}
          className="text-center max-w-2xl mx-auto mb-16"
        >
          <h2 className="text-4xl md:text-5xl font-bold tracking-tight text-white mb-4">
            The Core Intelligence
          </h2>
          <p className="text-lg text-slate-400">
             Specialized AI agents working together to understand and accelerate your learning.
          </p>
        </motion.div>

        {/* Clean Grid */}
        <div className="grid md:grid-cols-3 gap-6">

          {/* Multi-Agent Architecture */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
             whileInView={{ opacity: 1, y: 0 }}
             transition={{ duration: 0.5, delay: 0.1 }}
             viewport={{ once: true }} 
             className="bg-slate-900/30 backdrop-blur-sm border border-white/10 rounded-2xl p-8 hover:border-cyan-500/30 transition-all"
          >
             <div className="w-12 h-12 rounded-xl bg-cyan-500/10 flex items-center justify-center mb-6 text-cyan-400">
                 <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                     <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19.428 15.428a2 2 0 00-1.022-.547l-2.384-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" />
                 </svg>
             </div>
             <h3 className="text-xl font-bold text-white mb-3">Multi-Agent System</h3>
             <p className="text-slate-400 leading-relaxed">
                Specialized agents collaborate—Teacher, Evaluator, Strategy—each handling specific aspects of your learning journey.
             </p>
          </motion.div>

           {/* Adaptive Intelligence */}
           <motion.div
             initial={{ opacity: 0, y: 20 }}
             whileInView={{ opacity: 1, y: 0 }}
             transition={{ duration: 0.5, delay: 0.2 }}
             viewport={{ once: true }} 
             className="bg-slate-900/30 backdrop-blur-sm border border-white/10 rounded-2xl p-8 hover:border-purple-500/30 transition-all"
          >
              <div className="w-12 h-12 rounded-xl bg-purple-500/10 flex items-center justify-center mb-6 text-purple-400">
                 <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                 </svg>
              </div>
              <h3 className="text-xl font-bold text-white mb-3">Real-Time Adaptation</h3>
              <p className="text-slate-400 leading-relaxed mb-4">
                 Continuously adjusts difficulty and content based on your performance patterns.
              </p>
              <div className="space-y-2">
                  {["Instant feedback", "Dynamic difficulty", "Personalized paths"].map((item, i) => (
                      <div key={i} className="flex items-center gap-2 text-slate-300 text-sm">
                          <div className="w-1.5 h-1.5 rounded-full bg-purple-400" />
                          {item}
                      </div>
                  ))}
              </div>
          </motion.div>

          {/* Cognitive Tracking */}
          <motion.div
             initial={{ opacity: 0, y: 20 }}
             whileInView={{ opacity: 1, y: 0 }}
             transition={{ duration: 0.5, delay: 0.3 }}
             viewport={{ once: true }} 
             className="bg-slate-900/30 backdrop-blur-sm border border-white/10 rounded-2xl p-8 hover:border-green-500/30 transition-all"
          >
              <div className="w-12 h-12 rounded-xl bg-green-500/10 flex items-center justify-center mb-6 text-green-400">
                 <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
                 </svg>
              </div>
              <h3 className="text-xl font-bold text-white mb-3">Cognitive Profiling</h3>
              <p className="text-slate-400 leading-relaxed">
                  Tracks knowledge state explicitly, distinguishing between careless errors and fundamental conceptual gaps.
              </p>
          </motion.div>

        </div>

      </div>
    </section>
  );
};

export default AboutSection;
