import { motion } from "framer-motion";
import { Link } from "react-router-dom";

const PremiumSection = () => {
  return (
    <section id="premium" className="py-20 px-6 bg-[#050B14] relative overflow-hidden">
      
      {/* Subtle Background */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[400px] h-[400px] bg-cyan-500/5 blur-[120px] rounded-full pointer-events-none" />

      <div className="max-w-5xl mx-auto relative z-10">

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          viewport={{ once: true }}
          className="text-center mb-16"
        >
          <h2 className="text-4xl md:text-5xl font-bold tracking-tight text-white mb-4">
            Start Free, Upgrade When Ready
          </h2>
          <p className="text-lg text-slate-400 max-w-2xl mx-auto">
             Try core assessments free. Unlock the full agentic experience with Pro.
          </p>
        </motion.div>

        <div className="grid md:grid-cols-2 gap-6 items-start">

          {/* Free Plan */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            viewport={{ once: true }}
            className="border border-white/10 rounded-2xl p-8 bg-slate-900/30 backdrop-blur-sm"
          >
            <h3 className="text-xl font-bold text-white mb-2">Basic</h3>
            <div className="text-3xl font-bold text-slate-200 mb-1">$0</div>
            <p className="text-slate-400 text-sm mb-8">Perfect to start your journey</p>

            <ul className="mb-8 space-y-3">
              {["Concept Assessments", "Basic Score Tracking", "Static Roadmap", "Community Access"].map(item => (
                   <li key={item} className="flex items-center gap-3 text-slate-300 text-sm">
                       <svg className="w-4 h-4 text-slate-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                           <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                       </svg>
                       {item}
                   </li>
              ))}
            </ul>

            <Link to="/signup" className="w-full py-3 rounded-lg border border-white/10 text-white font-medium block text-center hover:bg-white/5 transition-colors text-sm">
              Get Started Free
            </Link>
          </motion.div>

          {/* Premium Plan */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
            viewport={{ once: true }}
            className="border border-cyan-500/30 rounded-2xl p-8 bg-slate-900/50 backdrop-blur-xl relative shadow-xl shadow-cyan-500/10"
          >
            <div className="absolute top-0 right-0 bg-cyan-500 text-black text-xs font-bold px-3 py-1 rounded-bl-lg uppercase tracking-wide">
                Recommended
            </div>

            <h3 className="text-xl font-bold text-white mb-2">Pro Agentic</h3>
            <div className="text-3xl font-bold text-white mb-1">$12<span className="text-base text-slate-400 font-normal">/month</span></div>
            <p className="text-slate-300 text-sm mb-8">Full multi-agent ecosystem</p>

            <ul className="mb-8 space-y-3">
              {[
                "Unlimited Agent Simulations", 
                "Deep Knowledge Gap Analysis", 
                "Personalized Strategy Agent", 
                "Mock Interview Prep"
              ].map(item => (
                   <li key={item} className="flex items-center gap-3 text-white text-sm">
                       <div className="w-4 h-4 rounded-full bg-cyan-500 flex items-center justify-center shrink-0">
                           <svg className="w-2.5 h-2.5 text-black" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                               <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                           </svg>
                       </div>
                       {item}
                   </li>
              ))}
            </ul>

            <button className="w-full py-3 rounded-lg bg-cyan-500 text-black font-bold hover:bg-cyan-400 transition-colors shadow-lg shadow-cyan-500/25 text-sm">
              Upgrade to Pro
            </button>
          </motion.div>

        </div>

      </div>
    </section>
  );
};

export default PremiumSection;
