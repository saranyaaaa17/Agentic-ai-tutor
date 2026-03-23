import React from "react";

const Logo = () => {
  return (
    <div className="flex items-center gap-3 cursor-pointer group">
      <div className="relative w-11 h-11 transition-transform duration-300 group-hover:scale-110">
        {/* Glow effect on hover */}
        <div className="absolute inset-0 bg-cyan-500/20 blur-xl rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
        
        {/* Agent SVG Logo */}
        <svg
          viewBox="0 0 48 48"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          className="w-full h-full relative z-10 drop-shadow-[0_0_8px_rgba(34,211,238,0.4)]"
        >
          {/* Robot Head */}
          <path
            d="M14 16C14 13.7909 15.7909 12 18 12H30C32.2091 12 34 13.7909 34 16V26C34 28.2091 32.2091 30 30 30H18C15.7909 30 14 28.2091 14 26V16Z"
            stroke="#22D3EE"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="group-hover:stroke-cyan-300 transition-colors"
          />
          
          {/* Visor/Eyes Display */}
          <path
            d="M18 18H30V22H18V18Z"
            fill="#22D3EE"
            fillOpacity="0.2"
            stroke="#22D3EE"
            strokeWidth="1.5"
            className="group-hover:fill-cyan-400/30 transition-colors"
          />
          
          {/* Left Eye Glow */}
          <circle
            cx="21"
            cy="20"
            r="1.5"
            fill="#22D3EE"
            className="group-hover:fill-cyan-300 transition-colors"
          >
            <animate
              attributeName="opacity"
              values="1;0.5;1"
              dur="2s"
              repeatCount="indefinite"
            />
          </circle>
          
          {/* Right Eye Glow */}
          <circle
            cx="27"
            cy="20"
            r="1.5"
            fill="#22D3EE"
            className="group-hover:fill-cyan-300 transition-colors"
          >
            <animate
              attributeName="opacity"
              values="1;0.5;1"
              dur="2s"
              repeatCount="indefinite"
            />
          </circle>
          
          {/* Antenna */}
          <line
            x1="24"
            y1="12"
            x2="24"
            y2="8"
            stroke="#22D3EE"
            strokeWidth="2"
            strokeLinecap="round"
            className="group-hover:stroke-cyan-300 transition-colors"
          />
          <circle
            cx="24"
            cy="7"
            r="2"
            fill="#22D3EE"
            className="group-hover:fill-cyan-300 transition-colors"
          />
          
          {/* Body */}
          <path
            d="M19 30V34C19 35.1046 19.8954 36 21 36H27C28.1046 36 29 35.1046 29 34V30"
            stroke="#22D3EE"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="group-hover:stroke-cyan-300 transition-colors"
          />
          
          {/* Arms */}
          <path
            d="M14 22L10 24"
            stroke="#22D3EE"
            strokeWidth="2"
            strokeLinecap="round"
            className="group-hover:stroke-cyan-300 transition-colors"
          />
          <path
            d="M34 22L38 24"
            stroke="#22D3EE"
            strokeWidth="2"
            strokeLinecap="round"
            className="group-hover:stroke-cyan-300 transition-colors"
          />
          
          {/* Body Details */}
          <circle
            cx="24"
            cy="33"
            r="1"
            fill="#22D3EE"
            fillOpacity="0.6"
          />
        </svg>
      </div>

      <div className="flex flex-col">
        <span className="text-xl font-black tracking-tighter bg-linear-to-r from-white to-slate-400 bg-clip-text text-transparent group-hover:to-blue-400 transition-all duration-300 uppercase">
          Agentic<span className="text-blue-500"> AI</span>
        </span>
        <span className="text-[8px] font-black text-slate-500 uppercase tracking-[0.4em] mt-0.5 group-hover:text-slate-400 transition-colors">
          Next-Gen Learning
        </span>
      </div>
    </div>
  );
};

export default Logo;
