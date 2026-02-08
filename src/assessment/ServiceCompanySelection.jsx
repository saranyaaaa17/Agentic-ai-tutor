import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { companyConfig } from "../lib/companyConfig";
import BackButton from "../components/ui/BackButton";

// Filter only service companies
const serviceCompanies = ['tcs', 'infosys', 'wipro', 'accenture'];

const ServiceCompanySelection = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-[#050B14] text-white p-8 md:p-12 font-sans selection:bg-blue-500/30 relative">
      <div className="max-w-7xl mx-auto">
        {/* Navigation */}
        <div className="absolute top-8 left-8 md:top-12 md:left-12 z-20">
          <BackButton to="/start-learning" label="Back to Tracks" />
        </div>

        {/* Header */}
        <motion.div
           initial={{ opacity: 0, y: -20 }}
           animate={{ opacity: 1, y: 0 }}
           className="mb-16 text-center"
        >
          <div className="inline-block mb-4 px-4 py-1 rounded-full border border-blue-500/30 bg-blue-500/10 text-blue-400 text-sm font-mono tracking-widest uppercase">
            Service & Mass Recruiter Track
          </div>
          <h1 className="text-4xl md:text-6xl font-black mb-6 bg-clip-text text-transparent bg-linear-to-b from-white to-slate-500">
            Mass Recruitment Drive
          </h1>
          <p className="text-[#9CA3AF] text-xl max-w-3xl mx-auto leading-relaxed">
            Prepare for high-volume recruitment tests.
            Focus on <span className="text-white font-bold">Aptitude, Logical Reasoning, and Speed</span>.
          </p>
        </motion.div>

        {/* Grid */}
        <div className="grid md:grid-cols-2 gap-8">
          {serviceCompanies.map((id, index) => {
             const company = companyConfig[id];
             return (
             <motion.div
               key={company.id}
               initial={{ opacity: 0, y: 20 }}
               animate={{ opacity: 1, y: 0 }}
               transition={{ delay: index * 0.1 }}
               whileHover={{ y: -5 }}
               className="bg-slate-900/50 border border-white/10 rounded-3xl overflow-hidden hover:border-blue-500/50 shadow-2xl transition-all group relative backdrop-blur-sm"
             >
                {/* Header Background */}
                <div className={`h-40 bg-linear-to-r ${company.color} relative p-8 overflow-hidden`}>
                   <div className="absolute top-4 right-4 flex items-center gap-2">
                       <div className="bg-black/40 backdrop-blur-md px-3 py-1 rounded-full text-xs font-mono border border-white/20 text-white">
                         {company.timeLimit / 60} Mins
                       </div>
                       <div className="bg-white p-1.5 rounded-lg shadow-lg">
                            <img src={company.logo} alt={company.name} className="w-10 h-10 object-contain" />
                       </div>
                   </div>
                   
                   {/* Abstract Pattern decoration */}
                   <div className="absolute right-0 bottom-0 opacity-10 transform translate-x-1/4 translate-y-1/4">
                       <svg width="200" height="200" viewBox="0 0 100 100" fill="white">
                           <circle cx="50" cy="50" r="40" stroke="white" strokeWidth="2" fill="none" />
                           <path d="M50 10 L50 90 M10 50 L90 50" stroke="white" strokeWidth="2" />
                       </svg>
                   </div>
                   
                   <h2 className="text-3xl font-bold text-white relative z-10 tracking-tight pr-14 leading-tight">{company.name}</h2>
                   <div className="text-white/80 text-sm mt-2 font-medium tracking-widest uppercase relative z-10 flex items-center gap-2">
                      <span className="w-2 h-2 rounded-full bg-white animate-pulse"/>
                      Recruitment Exam
                   </div>
                </div>

                {/* Body */}
                <div className="p-8">
                   <p className="text-slate-400 text-lg mb-8 h-14 leading-relaxed">
                     {company.description}
                   </p>

                   {/* Stats Grid */}
                   <div className="grid grid-cols-2 gap-4 mb-8">
                      <div className="bg-black/30 p-4 rounded-xl border border-white/5">
                        <div className="text-xs text-slate-500 uppercase tracking-widest mb-1">Focus Area</div>
                        <div className="font-bold text-blue-100 truncate">
                            {Object.entries(company.domains).reduce((a, b) => a[1].weight > b[1].weight ? a : b)[1].label}
                        </div>
                      </div>
                      <div className="bg-black/30 p-4 rounded-xl border border-white/5">
                        <div className="text-xs text-slate-500 uppercase tracking-widest mb-1">Difficulty</div>
                        <div className={`font-bold ${company.difficulty === 'Hard' ? 'text-red-400' : 'text-emerald-400'}`}>
                            {company.difficulty}
                        </div>
                      </div>
                   </div>

                   {/* Domain Weights Visualization */}
                   <div className="mb-8 space-y-3">
                      <div className="flex justify-between items-end">
                        <div className="text-xs text-slate-500 uppercase tracking-widest">Skill Weightage</div>
                      </div>
                      <div className="flex h-1.5 rounded-full overflow-hidden w-full bg-slate-800">
                        {Object.entries(company.domains).map(([key, domain]) => (
                            domain.weight > 0 && (
                                <div 
                                    key={key} 
                                    style={{ width: `${domain.weight * 100}%` }}
                                    className={`h-full ${
                                        key === 'quant' ? 'bg-blue-500' : 
                                        key === 'logical' ? 'bg-purple-500' :
                                        key === 'verbal' ? 'bg-orange-500' :
                                        key === 'programming' ? 'bg-green-500' : 'bg-slate-500'
                                    }`}
                                />
                            )
                        ))}
                      </div>
                      <div className="flex gap-4 text-xs text-slate-500 mt-2 justify-start font-mono">
                         <span className="flex items-center gap-1.5"><div className="w-1.5 h-1.5 rounded-full bg-blue-500"/>Quant</span>
                         <span className="flex items-center gap-1.5"><div className="w-1.5 h-1.5 rounded-full bg-purple-500"/>Logic</span>
                         <span className="flex items-center gap-1.5"><div className="w-1.5 h-1.5 rounded-full bg-green-500"/>Code</span>
                      </div>
                   </div>

                   <button
                     onClick={() => navigate(`/service-assessment?company=${company.id}`)}
                     className={`w-full py-4 rounded-xl font-bold text-lg transition-all shadow-lg text-white group-hover:scale-[1.02]
                        bg-linear-to-r ${company.color}`}
                   >
                     Start Diagnostic Test
                   </button>
                </div>
             </motion.div>
          )})}
        </div>
      </div>
    </div>
  );
};

export default ServiceCompanySelection;
