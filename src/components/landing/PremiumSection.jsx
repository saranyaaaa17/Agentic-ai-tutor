import { motion } from "framer-motion";
import { Link } from "react-router-dom";

const PremiumSection = () => {
  return (
    <section id="premium" className="py-28 px-6 bg-[#050B14] relative overflow-hidden">
      
      {/* Background Glow */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-cyan-500/10 blur-[150px] rounded-full pointer-events-none" />

      <div className="max-w-6xl mx-auto relative z-10">

        <motion.div
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          viewport={{ once: true }}
          className="text-center mb-20"
        >
          <div className="text-cyan-400 font-mono text-sm tracking-widest uppercase mb-4">Plans</div>
          <h2 className="text-4xl md:text-5xl font-bold tracking-tight text-white mb-6">
            Diagnostics are free.<br />
            <span className="text-transparent bg-clip-text bg-linear-to-r from-cyan-400 to-purple-500">Mastery is Premium.</span>
          </h2>
          <p className="text-lg text-slate-400 max-w-2xl mx-auto">
             Start with our core assessments to find where you stand. Upgrade to unlock the full adaptive agentic simulation.
          </p>
        </motion.div>

        <div className="grid md:grid-cols-2 gap-8 items-center">

          {/* Free Plan */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            whileInView={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5 }}
            viewport={{ once: true }}
            className="border border-white/10 rounded-3xl p-10 bg-slate-900/30 backdrop-blur-sm"
          >
            <h3 className="text-2xl font-bold text-white mb-2">Basic</h3>
            <div className="text-4xl font-bold text-slate-200 mb-6">$0</div>
            <p className="text-slate-400 text-sm mb-8">For students just starting their journey.</p>

            <ul className="mb-10 space-y-4">
              {["Concept Assessments", "Basic Score Tracking", "Static Roadmap", "Community Access"].map(item => (
                   <li key={item} className="flex items-center gap-3 text-slate-300">
                       <svg className="w-5 h-5 text-slate-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                           <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                       </svg>
                       {item}
                   </li>
              ))}
            </ul>

            <Link to="/signup" className="w-full py-4 rounded-xl border border-white/10 text-white font-bold block text-center hover:bg-white/5 transition-colors">
              Get Started Free
            </Link>
          </motion.div>

          {/* Premium Plan */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            whileInView={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.5 }}
            viewport={{ once: true }}
            className="border-2 border-cyan-500 rounded-3xl p-10 bg-slate-900/80 backdrop-blur-xl relative shadow-2xl shadow-cyan-500/20 transform md:-translate-y-4"
          >
            <div className="absolute top-0 right-0 bg-cyan-500 text-black text-xs font-bold px-4 py-1 rounded-bl-xl uppercase tracking-wider">
                Recommended
            </div>

            <h3 className="text-2xl font-bold text-white mb-2">Pro Agentic</h3>
            <div className="text-4xl font-bold text-white mb-6">$12<span className="text-lg text-slate-500 font-normal">/mo</span></div>
            <p className="text-slate-300 text-sm mb-8">Full access to the multi-agent ecosystem.</p>

            <ul className="mb-10 space-y-4">
              {[
                "Unlimited Agent Simulations", 
                "Deep Knowledge Gap Viz", 
                "Personalized Strategy Agent", 
                "Product & Service Mock Exams"
              ].map(item => (
                   <li key={item} className="flex items-center gap-3 text-white">
                       <div className="w-5 h-5 rounded-full bg-cyan-500 flex items-center justify-center text-black">
                           <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                               <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                           </svg>
                       </div>
                       {item}
                   </li>
              ))}
            </ul>

            <button className="w-full py-4 rounded-xl bg-cyan-500 text-black font-bold hover:bg-cyan-400 transition-colors shadow-lg shadow-cyan-500/25">
              Upgrade to Pro
            </button>
          </motion.div>

        </div>

      </div>
    </section>
  );
};

export default PremiumSection;
