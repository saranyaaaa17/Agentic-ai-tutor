import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import BackButton from "../components/ui/BackButton";

const StartLearning = () => {
  const navigate = useNavigate();

  const options = [
    {
      title: "Concept Mastery",
      description: "Deep dive into fundamental concepts with guided lessons.",
      color: "border-blue-500",
      hoverColor: "hover:border-blue-400",
      glow: "bg-blue-500/10",
      path: "/dashboard?mode=concept",
    },
    {
      title: "Problem Solving",
      description: "Practice coding challenges and logical puzzles.",
      color: "border-green-500",
      hoverColor: "hover:border-green-400",
      glow: "bg-green-500/10",
      path: "/dashboard?mode=problem",
    },
    {
      title: "Exam Preparation",
      description: "Structured prep for competitive exams and interviews.",
      color: "border-purple-500",
      hoverColor: "hover:border-purple-400",
      glow: "bg-purple-500/10",
      path: "/dashboard?mode=exam",
    },
  ];

  return (
    <div className="min-h-screen bg-[#0B1120] text-white flex flex-col items-center justify-center p-8 relative">
      
      {/* Navigation */}
      <div className="absolute top-8 left-8">
        <BackButton to="/" label="Home" />
      </div>

      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="text-center mb-16"
      >
        <h1 className="text-4xl md:text-5xl font-bold mb-4">
          Choose Your Path
        </h1>
        <p className="text-[#9CA3AF] text-lg max-w-2xl mx-auto">
          Select a learning mode to tailor your experience.
        </p>
      </motion.div>

      <div className="grid md:grid-cols-3 gap-8 max-w-6xl w-full">
        {options.map((option, index) => (
          <motion.div
            key={index}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: index * 0.1 }}
            whileHover={{ scale: 1.02 }}
            onClick={() => navigate(option.path)}
            className={`cursor-pointer group relative overflow-hidden
                        bg-[#0F172A] border ${option.color} border-opacity-50
                        rounded-2xl p-8 flex flex-col justify-between h-80
                        transition-all duration-300 shadow-xl ${option.hoverColor}`}
          >
            {/* Background Glow */}
            <div className={`absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 ${option.glow} blur-2xl`} />

            <div className="relative z-10">
              <h2 className="text-2xl font-bold mb-4 text-white">
                {option.title}
              </h2>
              <p className="text-[#9CA3AF] leading-relaxed">
                {option.description}
              </p>
            </div>

            <div className="relative z-10 mt-6 flex items-center text-sm font-medium text-white/50 group-hover:text-white transition-colors">
              <span>Select Mode</span>
              <svg className="w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
              </svg>
            </div>
            
          </motion.div>
        ))}
      </div>
    </div>
  );
};

export default StartLearning;
