import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import ThreeHeroVisual from "./ThreeHeroVisual";

const HeroSection = () => {
  const { user } = useAuth();
  
  return (
    <section className="relative w-full max-w-6xl mx-auto px-6 grid md:grid-cols-2 gap-16 items-center min-h-[600px] py-20">
      
      {/* Background Glow - Subtle */}
      <div className="absolute top-1/2 left-1/4 -translate-x-1/2 -translate-y-1/2 w-[400px] h-[400px] bg-cyan-500/5 rounded-full blur-[120px] pointer-events-none -z-10" />

      {/* Text Content */}
      <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="relative z-10 flex flex-col justify-center items-start"
      >
        <h1 className="text-5xl md:text-7xl font-bold tracking-tight leading-[1.1] mb-6 text-white">
          Learn Faster<br />
          <span className="text-cyan-400">
            With AI.
          </span>
        </h1>

        <p className="text-lg text-slate-400 mb-8 leading-relaxed max-w-md">
           Personalized lessons and practice problems that adapt to your speed and style.
        </p>

        <Link 
          to={user ? "/dashboard" : "/signup"} 
          className="inline-block px-8 py-3 bg-cyan-500 text-white font-medium text-sm rounded-lg transition-all hover:bg-cyan-400 shadow-lg shadow-cyan-500/25"
        >
           {user ? "Go to Dashboard" : "Get Started"}
        </Link>
        <div className="mt-8 flex items-center gap-4">
            <div className="flex -space-x-2">
                {[1,2,3].map(i => (
                    <div key={i} className="w-8 h-8 rounded-full border-2 border-slate-900 bg-slate-800 flex items-center justify-center text-[10px] text-cyan-400 font-bold">
                        {i === 1 ? 'AI' : i === 2 ? '🎓' : '⚡'}
                    </div>
                ))}
            </div>
            <p className="text-xs text-slate-500">
                <span className="text-cyan-400 font-bold">Socratic AI Mentor</span> is ready to guide you.
            </p>
        </div>
      </motion.div>

      {/* Visual / Graphic - Real 3D Visual */}
      <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 1 }}
          className="relative h-[500px] w-full"
      >
          <ThreeHeroVisual />
      </motion.div>

    </section>
  );
};

export default HeroSection;
