import { motion } from "framer-motion";

const agents = [
  {
    title: "Personalized Lessons",
    role: "Learn Smarter",
    color: "yellow",
    description: "Lessons that adapt to your knowledge, making complex topics easy to understand."
  },
  {
    title: "Instant Feedback",
    role: "Improve Faster",
    color: "green",
    description: "Get detailed explanations for every answer, helping you learn from your mistakes."
  },
  {
    title: "Smart Search",
    role: "Find Anything",
    color: "blue",
    description: "Quickly find the concepts and resources you need to stay on track."
  },
  {
    title: "Learning Roadmap",
    role: "Stay Structured",
    color: "purple",
    description: "A clear, personalized path showing exactly what to learn next."
  }
];

const colorMap = {
  yellow: { bg: "bg-yellow-500", text: "text-yellow-400", border: "border-yellow-500/20" },
  green: { bg: "bg-green-500", text: "text-green-400", border: "border-green-500/20" },
  blue: { bg: "bg-blue-500", text: "text-blue-400", border: "border-blue-500/20" },
  purple: { bg: "bg-purple-500", text: "text-purple-400", border: "border-purple-500/20" }
};

const FeaturesSection = () => {
  return (
    <section id="features" className="py-20 px-6 bg-[#0B1120]">
      <div className="max-w-6xl mx-auto">

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          viewport={{ once: true }}
          className="text-center max-w-2xl mx-auto mb-16"
        >
          <h2 className="text-4xl md:text-5xl font-bold tracking-tight text-white mb-4">
            How It Works
          </h2>
          <p className="text-lg text-slate-400">
             Powerful technology made simple to help you master any subject.
          </p>
        </motion.div>

        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {agents.map((agent, index) => (
                <motion.div
                    key={index}
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5, delay: index * 0.1 }}
                    viewport={{ once: true }}
                    className={`bg-slate-900/30 backdrop-blur-sm border ${colorMap[agent.color].border} rounded-2xl p-6 hover:border-${agent.color}-500/40 transition-all`}
                >
                    <div className="w-12 h-12 rounded-xl bg-cyan-500/5 flex items-center justify-center mb-4 border border-cyan-500/10 group-hover:bg-cyan-500/20 group-hover:scale-110 transition-all duration-300">
                        {agent.color === 'yellow' ? (
                          <svg className="w-6 h-6 text-cyan-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" /></svg>
                        ) : agent.color === 'green' ? (
                          <svg className="w-6 h-6 text-cyan-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                        ) : agent.color === 'blue' ? (
                          <svg className="w-6 h-6 text-cyan-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeWidth={2} d="M4 7v10c0 2.21 3.582 4 8 4s8-1.79 8-4V7M4 7c0 2.21 3.582 4 8 4s8-1.79 8-4M4 7c0-2.21 3.582-4 8-4s8 1.79 8 4m0 5c0 2.21-3.582 4-8 4s-8-1.79-8-4" /></svg>
                        ) : (
                          <svg className="w-6 h-6 text-cyan-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeWidth={2} d="M9 20l-5.447-2.724A2 2 0 013 15.488V5.512a2 2 0 011.053-1.764L9 1V20zm0 0l5.447-2.724A2 2 0 0015 15.488V5.512a2 2 0 00-1.053-1.764L9 1V20zm0 0v-19" /></svg>
                        )}
                    </div>

                    <h3 className="text-lg font-bold text-white mb-1">
                        {agent.title}
                    </h3>
                    <div className={`text-xs font-medium ${colorMap[agent.color].text} mb-3 uppercase tracking-wide`}>
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
