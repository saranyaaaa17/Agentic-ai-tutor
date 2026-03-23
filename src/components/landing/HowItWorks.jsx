import { motion } from "framer-motion";

const steps = [
  {
    title: "Take an Assessment",
    desc: "Answer questions or solve coding problems at your own pace.",
    icon: (
      <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
      </svg>
    )
  },
  {
    title: "AI Analyzes Your Work",
    desc: "Our agents evaluate your answers, identify patterns, and spot knowledge gaps.",
    icon: (
      <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
      </svg>
    )
  },
  {
    title: "Get Personalized Insights",
    desc: "See exactly what you know, what you're missing, and where to focus next.",
    icon: (
      <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
      </svg>
    )
  },
  {
    title: "Follow Your Custom Path",
    desc: "Practice with problems tailored to fill your specific gaps and build mastery.",
    icon: (
      <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
      </svg>
    )
  }
];

const HowItWorks = () => {
  return (
    <section id="workflow" className="py-20 px-6 bg-[#050B14] overflow-hidden relative">
      
      <div className="max-w-5xl mx-auto relative z-10">

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          viewport={{ once: true }}
          className="text-center mb-16"
        >
          <h2 className="text-4xl md:text-5xl font-bold tracking-tight text-white mb-4">
            How It Works
          </h2>
          <p className="text-lg text-slate-400 max-w-2xl mx-auto">
            Four simple steps from assessment to mastery
          </p>
        </motion.div>

        {/* Compact Zigzag Timeline */}
        <div className="relative">
          {/* Central Vertical Line */}
          <div className="absolute left-1/2 top-0 bottom-0 w-px bg-linear-to-b from-cyan-500/40 via-purple-500/40 to-cyan-500/40 hidden md:block" />
          
          <div className="space-y-8">
            {steps.map((step, index) => {
              const isLeft = index % 2 === 0;
              return (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, x: isLeft ? -50 : 50 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.6, delay: index * 0.1 }}
                  viewport={{ once: true }}
                  className={`relative flex items-center ${isLeft ? 'md:justify-start justify-center' : 'md:justify-end justify-center'}`}
                >
                  {/* Timeline Bullet */}
                  <div className="hidden md:flex absolute left-1/2 -translate-x-1/2 z-20">
                    <div className="w-3 h-3 rounded-full bg-cyan-500 relative">
                      <div className="absolute inset-0 rounded-full border-2 border-cyan-500/30 scale-[2.5]" />
                    </div>
                  </div>

                  {/* Compact Card with Hover Expansion */}
                  <div className={`w-full md:w-[45%] bg-slate-900/50 backdrop-blur-sm border border-white/10 
                                  rounded-2xl p-6 hover:p-8 transition-all duration-300 
                                  hover:border-cyan-500/30 hover:shadow-xl hover:shadow-cyan-500/10 
                                  group relative overflow-hidden cursor-pointer`}>
                    
                    {/* Background Glow */}
                    <div className="absolute inset-0 opacity-0 group-hover:opacity-10 transition-opacity duration-500 bg-cyan-500 blur-2xl" />
                    
                    <div className="relative z-10">
                      {/* Icon + Title (Always Visible) */}
                      <div className="flex items-center gap-4">
                        <div className="w-10 h-10 rounded-xl bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center text-cyan-400 group-hover:bg-cyan-500/20 transition-colors shrink-0">
                          {step.icon}
                        </div>
                        <h3 className="text-lg md:text-xl font-bold text-white group-hover:text-cyan-400 transition-colors">
                          {step.title}
                        </h3>
                      </div>
                      
                      {/* Description (Show on Hover) */}
                      <div className="grid grid-rows-[0fr] group-hover:grid-rows-[1fr] transition-all duration-300">
                        <div className="overflow-hidden">
                          <p className="text-slate-400 leading-relaxed mt-4 pt-4 border-t border-white/5">
                            {step.desc}
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </div>
        </div>

      </div>
    </section>
  );
};

export default HowItWorks;
