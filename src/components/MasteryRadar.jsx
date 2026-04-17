import { motion, AnimatePresence } from "framer-motion";
import { useState } from "react";
import { normalizeMasteryScore } from "../utils/syncUtils";

const MasteryRadar = ({ masteryProfile = {} }) => {
  const [hoveredData, setHoveredData] = useState(null);

  if (!masteryProfile || Object.keys(masteryProfile).length === 0) return null;
  const MAX_DISPLAY_AXES = 12;
  const entries = Object.entries(masteryProfile);
  
  let processedEntries = entries;
  if (entries.length > MAX_DISPLAY_AXES) {
      // Pick representative points: Top 6 strongest and 6 weakest to keep shape context
      const sorted = [...entries].sort((a, b) => normalizeMasteryScore(b[1]) - normalizeMasteryScore(a[1]));
      const top = sorted.slice(0, 6);
      const bottom = sorted.slice(-6);
      
      // Deduplicate by concept name using a Map
      const uniqueMap = new Map();
      [...top, ...bottom].forEach(([key, val]) => {
          uniqueMap.set(key, val);
      });
      processedEntries = Array.from(uniqueMap.entries());
  }

  // Label formatting and truncation to avoid "clumsy" overcrowding
  const concepts = processedEntries.map(e => {
      let label = e[0].split(/[_\s]/).map(word => {
          if (word.length > 8) return word.substring(0, 5) + "..";
          return word;
      }).join(" ");
      return label.length > 14 ? label.substring(0, 12) + ".." : label;
  });
  
  const values = processedEntries.map(e => normalizeMasteryScore(e[1]));
  
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
    return { 
        x, 
        y, 
        label: concept,
        fullName: processedEntries[i][0],
        angle 
    };
  });

  return (
    <div className="relative w-full max-w-sm mx-auto bg-slate-900/50 p-6 rounded-3xl border border-white/5 shadow-xl overflow-hidden group/radar">
      <div className="absolute top-4 left-4 flex items-center justify-between w-[90%] z-10">
           <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-blue-500 animate-pulse"></div>
              <span className="text-[10px] font-black uppercase tracking-[0.24em] text-slate-400">Mastery Scan</span>
           </div>
           
           {/* Dynamic Tooltip Overlay */}
           <AnimatePresence>
             {hoveredData && (
                 <motion.div 
                    initial={{ opacity: 0, x: 10 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: 5 }}
                    className="flex flex-col items-end"
                 >
                    <span className="text-[10px] font-bold text-white uppercase tracking-wider truncate max-w-[120px]">
                      {hoveredData.name}
                    </span>
                    <span className={`text-[9px] font-black ${hoveredData.val < 0.45 ? 'text-rose-400' : 'text-emerald-400'}`}>
                      {Math.round(hoveredData.val * 100)}% Proficiency
                    </span>
                 </motion.div>
             )}
           </AnimatePresence>
      </div>
      
      <svg viewBox="0 0 300 300" className="w-full h-full transform transition-all hover:scale-105 duration-500">
        {/* Radar Background (Concentric Circles) */}
        {[0.2, 0.4, 0.6, 0.8, 1].map((scale, i) => (
           <circle key={i} cx={centerX} cy={centerY} r={radius * scale} fill="none" stroke="rgba(255,255,255,0.03)" strokeDasharray="3 3" />
        ))}

        {/* Axes and Labels */}
        {axes.map((axis, i) => {
            const labelRadius = radius + 24;
            const lx = centerX + labelRadius * Math.cos(axis.angle);
            const ly = centerY + labelRadius * Math.sin(axis.angle);
            
            return (
              <g key={i} 
                 onMouseEnter={() => setHoveredData({ name: axis.fullName, val: values[i] })}
                 onMouseLeave={() => setHoveredData(null)}
              >
                <line x1={centerX} y1={centerY} x2={axis.x} y2={axis.y} stroke="rgba(255,255,255,0.06)" />
                <text 
                    x={lx} 
                    y={ly} 
                    fill={hoveredData?.name === axis.fullName ? "#3b82f6" : "#94a3b8"}
                    fontSize={numAxes > 8 ? "6" : "7.5"} 
                    textAnchor="middle" 
                    alignmentBaseline="middle"
                    className="uppercase font-black tracking-widest opacity-80 cursor-help transition-all"
                >
                  {axis.label}
                  <title>{axis.fullName}</title>
                </text>
                {/* Transparent hit area for easier hovering */}
                <circle cx={lx} cy={ly} r="15" fill="transparent" className="cursor-help" />
              </g>
            );
        })}

        {/* Data Polygon */}
        <motion.polygon
          points={points}
          fill="rgba(59, 130, 246, 0.25)"
          stroke="#3b82f6"
          strokeWidth="1.5"
          initial={{ opacity: 0, scale: 0 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 1.2, ease: "circOut" }}
        />
        
        {/* Nodes */}
        {values.map((val, i) => {
             const angle = (Math.PI * 2 * i) / numAxes - Math.PI / 2;
             const r = (val / maxValue) * radius;
             const x = centerX + r * Math.cos(angle);
             const y = centerY + r * Math.sin(angle);
             
             let color = "#3b82f6"; // Blue
             if (val < 0.45) color = "#f43f5e"; // Rose (Risk)
             else if (val > 0.85) color = "#10b981"; // Emerald (Strong)

             return (
                 <circle 
                    key={i} 
                    cx={x} 
                    cy={y} 
                    r={numAxes > 10 ? "2" : "3.5"} 
                    fill={color} 
                    stroke="white" 
                    strokeWidth="1" 
                    className="cursor-pointer"
                    onMouseEnter={() => setHoveredData({ name: processedEntries[i][0], val })}
                    onMouseLeave={() => setHoveredData(null)}
                 >
                    <title>{processedEntries[i][0]}: {Math.round(val * 100)}%</title>
                 </circle>
             );
        })}

      </svg>
      <div className="mt-4 flex flex-col items-center">
        {entries.length > MAX_DISPLAY_AXES && (
            <p className="text-[9px] text-center text-slate-500 font-mono italic uppercase tracking-tight">
              Showing top {MAX_DISPLAY_AXES} indicators for clarity
            </p>
        )}
        {hoveredData && (
          <p className="text-[10px] font-bold text-blue-400 uppercase tracking-widest mt-1">
            Focus: {hoveredData.name}
          </p>
        )}
      </div>
    </div>
  );
};

export default MasteryRadar;
