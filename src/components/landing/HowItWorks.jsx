import { motion } from "framer-motion";

const steps = [
  {
    id: "01",
    title: "You Response",
    desc: "You attempt a complex coding problem or concept query.",
    color: "bg-blue-500",
    border: "border-blue-500"
  },
  {
    id: "02",
    title: "Evaluation Node",
    desc: "Multiple Evaluator Agents analyze your syntax, logic, and efficiency independently.",
    color: "bg-yellow-500",
    border: "border-yellow-500"
  },
  {
    id: "03",
    title: "Gap Detection",
    desc: "The Knowledge Gap Agent compares your output vs. expected mental models.",
    color: "bg-red-500",
    border: "border-red-500"
  },
  {
    id: "04",
    title: "Strategy Adapts",
    desc: "The Strategy Agent routes you to a Foundation reset or an Elite challenge.",
    color: "bg-purple-500",
    border: "border-purple-500"
  },
  {
    id: "05",
    title: "Mastery Builds",
    desc: "You advance through calibrated tiers (Beginner → Professional → Elite).",
    color: "bg-green-500",
    border: "border-green-500"
  }
];

const HowItWorks = () => {
  return (
    <section id="how" className="py-28 px-6 bg-[#050B14] overflow-hidden relative">
      
      <div className="max-w-4xl mx-auto relative z-10">

        <motion.div
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          viewport={{ once: true }}
          className="text-center mb-20"
        >
          <div className="text-cyan-400 font-mono text-sm tracking-widest uppercase mb-4">The Workflow</div>
          <h2 className="text-4xl md:text-5xl font-bold tracking-tight text-white">
            Architecture of a Session
          </h2>
        </motion.div>

        <div className="relative">
          {/* Vertical Timeline Line */}
          <div className="absolute left-8 md:left-1/2 top-0 bottom-0 w-0.5 bg-gradient-to-b from-cyan-500/50 via-purple-500/50 to-transparent -translate-x-1/2" />

          <div className="space-y-12">
            {steps.map((step, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
                viewport={{ once: true }}
                className={`relative flex items-center md:justify-between ${index % 2 === 0 ? 'md:flex-row-reverse' : ''}`}
              >
                
                {/* Content Box */}
                <div className="w-full pl-20 md:pl-0 md:w-[45%]">
                   <div className="bg-slate-900/80 backdrop-blur-md border border-white/10 p-6 rounded-2xl hover:border-white/20 transition-all shadow-xl group">
                       <h3 className="text-xl font-bold text-white mb-2 flex items-center gap-3">
                           <span className={`w-2 h-8 rounded-full ${step.color}`} />
                           {step.title}
                       </h3>
                       <p className="text-slate-400 text-sm leading-relaxed">
                           {step.desc}
                       </p>
                   </div>
                </div>

                {/* Center Node */}
                <div className="absolute left-8 md:left-1/2 -translate-x-1/2 flex items-center justify-center">
                    <div className={`w-12 h-12 rounded-full bg-[#050B14] border-4 ${step.border} z-20 flex items-center justify-center shadow-[0_0_15px_rgba(0,0,0,0.5)]`}>
                        <div className={`w-3 h-3 rounded-full ${step.color} animate-pulse`} />
                    </div>
                </div>

                {/* Empty Side for layout balance */}
                <div className="hidden md:block w-[45%]" />

              </motion.div>
            ))}
          </div>
        </div>

      </div>
    </section>
  );
};

export default HowItWorks;
