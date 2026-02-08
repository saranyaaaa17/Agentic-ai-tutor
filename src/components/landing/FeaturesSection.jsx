import { motion } from "framer-motion";

const agents = [
  {
    title: "Teacher Agent",
    role: "Instruction & Explanation",
    image: "bg-yellow-500",
    description: "Generates structured, Socratic explanations tailored to your current mental model. It doesn't just give answers, it teaches."
  },
  {
    title: "Evaluator Agent",
    role: "Analysis & Grading",
    image: "bg-green-500",
    description: "Parses your code AST (Abstract Syntax Tree) to find logical flaws, efficiency issues, and stylistic anti-patterns."
  },
  {
    title: "Knowledge Agent",
    role: "Context Retrieval",
    image: "bg-blue-500",
    description: "Scans thousands of documents to find the exact prerequisite concept you missed and serves it instantly."
  },
  {
    title: "Strategy Agent",
    role: "Path Optimization",
    image: "bg-purple-500",
    description: "The mastermind. It decides if you need a grind session, a challenge, or a break based on your cognitive load."
  }
];

const FeaturesSection = () => {
  return (
    <section id="features" className="py-28 px-6 bg-[#0B1120]">
      <div className="max-w-7xl mx-auto">

        <motion.div
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          viewport={{ once: true }}
          className="text-center max-w-3xl mx-auto mb-20"
        >
          <div className="text-purple-400 font-mono text-sm tracking-widest uppercase mb-4">The Squad</div>
          <h2 className="text-4xl md:text-5xl font-bold tracking-tight text-white mb-6">
            Meet Your Specialized Agents
          </h2>
          <p className="text-lg text-slate-400">
             Each agent has a singular purpose. Together, they form a hive mind dedicated to your mastery.
          </p>
        </motion.div>

        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {agents.map((agent, index) => (
                <motion.div
                    key={index}
                    initial={{ opacity: 0, y: 24 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5, delay: index * 0.1 }}
                    viewport={{ once: true }}
                    className="bg-slate-900/50 backdrop-blur-sm border border-white/5 rounded-3xl p-6 hover:bg-slate-800/80 transition-all group relative overflow-hidden"
                >
                    <div className={`absolute top-0 left-0 w-full h-1 ${agent.image} opacity-50 group-hover:opacity-100 transition-opacity`} />
                    
                    <div className="w-14 h-14 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                        <div className={`w-4 h-4 rounded-full ${agent.image} shadow-[0_0_15px_currentColor]`} />
                    </div>

                    <h3 className="text-xl font-bold text-white mb-1 group-hover:text-cyan-400 transition-colors">
                        {agent.title}
                    </h3>
                    <div className="text-xs font-mono text-slate-500 mb-4 uppercase tracking-wide">
                        {agent.role}
                    </div>
                    <p className="text-slate-400 text-sm leading-relaxed">
                        {agent.description}
                    </p>
                </motion.div>
            ))}
        </div>

      </div>
    </section>
  );
};

export default FeaturesSection;
