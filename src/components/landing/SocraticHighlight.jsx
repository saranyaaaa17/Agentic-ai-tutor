import { motion } from "framer-motion";

const SocraticHighlight = () => {
  return (
    <section className="py-24 px-6 relative overflow-hidden">
      <div className="absolute top-1/2 right-0 -translate-y-1/2 w-[500px] h-[500px] bg-cyan-500/10 blur-[120px] rounded-full pointer-events-none" />
      
      <div className="max-w-6xl mx-auto grid md:grid-cols-2 gap-16 items-center">
        
        <motion.div
           initial={{ opacity: 0, x: -20 }}
           whileInView={{ opacity: 1, x: 0 }}
           transition={{ duration: 0.6 }}
           viewport={{ once: true }}
        >
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-cyan-500/10 border border-cyan-500/20 text-cyan-400 text-xs font-bold mb-6 uppercase tracking-widest">
            Your Personal Tutor
          </div>
          <h2 className="text-4xl md:text-5xl font-bold text-white mb-6 leading-tight">
            Meet <span className="text-cyan-400">Socratic</span>.<br />
            The AI that helps you learn better.
          </h2>
          <p className="text-lg text-slate-400 mb-8 leading-relaxed">
            Socratic is more than just a chatbot. He's a specialized AI tutor that understands your learning style, identifies where you need help, and builds real-time study plans just for you.
          </p>
          
          <div className="space-y-4">
            {[
              { 
                title: "Personalized Strategy", 
                desc: "He tailors every lesson and exercise to your specific needs.",
                icon: (
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <circle cx="12" cy="12" r="10" strokeWidth={1.5} />
                    <circle cx="12" cy="12" r="2" strokeWidth={1.5} />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 2v4m0 12v4M2 12h4m12 0h4" />
                  </svg>
                )
              },
              { 
                title: "24/7 Availability", 
                desc: "Ask questions about your curriculum anytime, anywhere.",
                icon: (
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                )
              },
              { 
                title: "Visual Learning", 
                desc: "Generates architectural diagrams and flowcharts instantly.",
                icon: (
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2-2v12a2 2 0 002 2z" />
                  </svg>
                )
              }
            ].map((feature, i) => (
              <div key={i} className="flex gap-4 p-4 rounded-xl bg-slate-900/40 border border-white/5 hover:border-cyan-500/30 transition-all group">
                <div className="w-10 h-10 rounded-lg bg-cyan-500/10 flex items-center justify-center text-cyan-400 group-hover:bg-cyan-500/20 group-hover:scale-110 transition-all">
                    {feature.icon}
                </div>
                <div>
                  <h4 className="text-white font-bold text-sm mb-1 group-hover:text-cyan-400 transition-colors">{feature.title}</h4>
                  <p className="text-slate-500 text-xs leading-relaxed">{feature.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </motion.div>

        <motion.div
           initial={{ opacity: 0, scale: 0.9 }}
           whileInView={{ opacity: 1, scale: 1 }}
           transition={{ duration: 0.8 }}
           viewport={{ once: true }}
           className="relative"
        >
          {/* Mockup for the Socratic Chatbot */}
          <div className="bg-slate-950 border border-white/10 rounded-3xl p-6 shadow-2xl relative z-10 overflow-hidden">
             <div className="flex items-center gap-3 mb-6 border-b border-white/5 pb-4">
                <div className="w-10 h-10 rounded-xl bg-linear-to-br from-cyan-500 to-indigo-600 flex items-center justify-center text-white">
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeWidth={2.5} d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>
                </div>
                <div>
                  <h3 className="text-white font-bold text-sm">Socratic</h3>
                  <div className="flex items-center gap-1.5">
                    <div className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />
                    <span className="text-[10px] text-slate-500 uppercase font-bold tracking-tighter">Analyzing Knowledge Gaps...</span>
                  </div>
                </div>
             </div>
             
             <div className="space-y-4 mb-6">
                <div className="flex justify-end">
                    <div className="bg-cyan-600/20 border border-cyan-500/30 text-cyan-100 text-[11px] p-3 rounded-2xl rounded-tr-none">
                        "How do I balance high-performance C++ with low memory usage?"
                    </div>
                </div>
                <div className="flex justify-start">
                     <div className="bg-slate-900 border border-white/5 text-slate-300 text-[11px] p-3 rounded-2xl rounded-tl-none space-y-2">
                        <p>I noticed you're working on **Pointers**. Here's a quick plan to help you master it:</p>
                        <ul className="text-[10px] space-y-1 text-slate-400">
                            <li>1. Smart Pointer basics</li>
                            <li>2. Visualizing memory allocations</li>
                            <li>3. Quick practice test</li>
                        </ul>
                    </div>
                </div>
             </div>
             
             <div className="bg-white/5 rounded-xl p-3 border border-white/5 flex items-center justify-between">
                <span className="text-[10px] text-slate-600">Ask Socratic anything...</span>
                <div className="w-6 h-6 bg-cyan-500 rounded-lg flex items-center justify-center"><svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path d="M13 7l5 5m0 0l-5 5m5-5H6" /></svg></div>
             </div>
          </div>
          
          {/* Decorative accents */}
          <div className="absolute -top-6 -left-6 w-32 h-32 bg-cyan-500/20 blur-[60px] rounded-full" />
          <div className="absolute -bottom-6 -right-6 w-32 h-32 bg-blue-500/20 blur-[60px] rounded-full" />
        </motion.div>

      </div>
    </section>
  );
};

export default SocraticHighlight;
