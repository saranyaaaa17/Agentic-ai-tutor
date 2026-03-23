
import { motion } from "framer-motion";
import { normalizeMasteryScore } from "../utils/syncUtils";

const MasteryRadar = ({ masteryProfile = {} }) => {
  if (!masteryProfile || Object.keys(masteryProfile).length === 0) return null;

  const concepts = Object.keys(masteryProfile);
  const values = Object.values(masteryProfile).map(normalizeMasteryScore);
  const maxValue = 1.0;
  const numAxes = concepts.length;
  const radius = 100;
  const centerX = 150;
  const centerY = 150;

  // Calculate polygon points
  const points = values.map((val, i) => {
    const angle = (Math.PI * 2 * i) / numAxes - Math.PI / 2;
    const r = (val / maxValue) * radius;
    const x = centerX + r * Math.cos(angle);
    const y = centerY + r * Math.sin(angle);
    return `${x},${y}`;
  }).join(" ");

  // Axis lines
  const axes = concepts.map((concept, i) => {
    const angle = (Math.PI * 2 * i) / numAxes - Math.PI / 2;
    const x = centerX + radius * Math.cos(angle);
    const y = centerY + radius * Math.sin(angle);
    return { x, y, label: concept };
  });

  return (
    <div className="relative w-full max-w-sm mx-auto bg-slate-900/50 p-6 rounded-3xl border border-white/5 shadow-xl">
      <div className="absolute top-4 left-4 flex items-center gap-2">
           <div className="w-2 h-2 rounded-full bg-blue-500 animate-pulse"></div>
           <span className="text-xs font-bold uppercase tracking-widest text-slate-400">Mastery Scan</span>
      </div>
      
      <svg viewBox="0 0 300 300" className="w-full h-full transform transition-transform hover:scale-105 duration-500">
        {/* Radar Background (Concentric Circles) */}
        {[0.2, 0.4, 0.6, 0.8, 1].map((scale, i) => (
           <circle key={i} cx={centerX} cy={centerY} r={radius * scale} fill="none" stroke="rgba(255,255,255,0.05)" strokeDasharray="4 4" />
        ))}

        {/* Axes */}
        {axes.map((axis, i) => (
          <g key={i}>
            <line x1={centerX} y1={centerY} x2={axis.x} y2={axis.y} stroke="rgba(255,255,255,0.1)" />
            <text 
                x={axis.x} 
                y={axis.y} 
                fill="#94a3b8" 
                fontSize="10" 
                textAnchor="middle" 
                alignmentBaseline="middle"
                className="uppercase font-bold tracking-wider"
                transform={`translate(${axis.x > centerX ? 10 : -10}, ${axis.y > centerY ? 10 : -10})`}
            >
              {axis.label}
            </text>
          </g>
        ))}

        {/* Data Polygon */}
        <motion.polygon
          points={points}
          fill="rgba(59, 130, 246, 0.2)"
          stroke="#3b82f6"
          strokeWidth="2"
          initial={{ opacity: 0, scale: 0 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 1, ease: "easeOut" }}
        />
        
        {/* Nodes */}
        {values.map((val, i) => {
             const angle = (Math.PI * 2 * i) / numAxes - Math.PI / 2;
             const r = (val / maxValue) * radius;
             const x = centerX + r * Math.cos(angle);
             const y = centerY + r * Math.sin(angle);
             
             // Dynamic Color based on mastery
             let color = "#3b82f6"; // Blue
             if (val < 0.4) color = "#ef4444"; // Red (Risk)
             else if (val > 0.8) color = "#10b981"; // Green (Strong)

             return (
                 <circle key={i} cx={x} cy={y} r="4" fill={color} stroke="white" strokeWidth="1.5" />
             );
        })}

      </svg>
    </div>
  );
};

export default MasteryRadar;
