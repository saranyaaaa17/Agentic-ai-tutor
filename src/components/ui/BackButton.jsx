import { useNavigate } from "react-router-dom";

const BackButton = ({ to, label = "Back", className = "" }) => {
  const navigate = useNavigate();

  const handleBack = () => {
    if (to) {
      navigate(to);
    } else {
      navigate(-1);
    }
  };

  return (
    <button
      onClick={handleBack}
      className={`group flex items-center gap-2 px-4 py-2 
                  bg-white/5 hover:bg-white/10 
                  border border-white/10 hover:border-cyan-500/50 
                  rounded-lg backdrop-blur-md 
                  text-slate-400 hover:text-cyan-400 
                  transition-all duration-300 ${className}`}
    >
      <svg 
        className="w-4 h-4 transform group-hover:-translate-x-1 transition-transform" 
        fill="none" 
        viewBox="0 0 24 24" 
        stroke="currentColor"
      >
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
      </svg>
      <span className="text-sm font-medium">{label}</span>
    </button>
  );
};

export default BackButton;
