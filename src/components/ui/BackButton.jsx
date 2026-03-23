import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";

const BackButton = ({ to, label = "Back", className = "", onClick }) => {
    const navigate = useNavigate();

    const handleClick = () => {
        if (onClick) onClick();
        else if (to) navigate(to);
        else navigate(-1);
    };

    return (
        <motion.button
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            whileHover={{ x: -4 }}
            onClick={handleClick}
            className={`group flex items-center gap-2 px-3 py-1.5 rounded-xl 
                        text-slate-400 hover:text-cyan-400 
                        hover:bg-cyan-500/5 transition-all duration-300 
                        backdrop-blur-sm ${className}`}
        >
            <div className="w-8 h-8 flex items-center justify-center rounded-lg bg-slate-900 shadow-lg border border-white/5 group-hover:border-cyan-500/30 transition-colors">
                <svg className="w-4 h-4 transition-transform group-hover:-translate-x-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                </svg>
            </div>
            <span className="text-xs font-mono uppercase tracking-[0.2em] font-bold">
                {label}
            </span>
        </motion.button>
    );
};

export default BackButton;
