import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { companyConfig } from "../lib/companyConfig";
import Logo from "../components/layout/logo";

const productCompanies = ['google', 'amazon', 'microsoft', 'meta'];
const productInsights = [
  { label: "Challenge Style", value: "DSA + OA" },
  { label: "Difficulty", value: "High" },
  { label: "Ideal Focus", value: "Speed + Accuracy" }
];
const productSidebarStats = [
  { label: "Track", value: "Product OA" },
  { label: "Difficulty", value: "High" },
  { label: "Companies", value: `${productCompanies.length}` }
];

const diffBadge = (diff) => {
  const map = {
    "Easy": "bg-green-500/10 text-green-400 border-green-500/20",
    "Medium": "bg-amber-500/10 text-amber-400 border-amber-500/20",
    "Hard": "bg-red-500/10 text-red-400 border-red-500/20"
  };
  return map[diff] || "bg-slate-700 text-slate-400";
};

const Icon = {
  ArrowLeft: (p) => (
    <svg {...p} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <line x1="19" y1="12" x2="5" y2="12"/><polyline points="12 19 5 12 12 5"/>
    </svg>
  ),
  BookOpen: (p) => (
    <svg {...p} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z"/><path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z"/>
    </svg>
  ),
  ChevronRight: (p) => (
    <svg {...p} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="9 18 15 12 9 6"/>
    </svg>
  ),
  Spark: (p) => (
    <svg {...p} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 3l1.8 5.2L19 10l-5.2 1.8L12 17l-1.8-5.2L5 10l5.2-1.8L12 3z"/>
    </svg>
  ),
  Clock: (p) => (
    <svg {...p} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="9"/>
      <path d="M12 7v5l3 2"/>
    </svg>
  ),
  Layers: (p) => (
    <svg {...p} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 3l9 4.5-9 4.5-9-4.5L12 3z"/>
      <path d="M3 12l9 4.5 9-4.5"/>
      <path d="M3 16.5l9 4.5 9-4.5"/>
    </svg>
  )
};

const ProductCompanySelection = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-slate-950 text-slate-200 flex font-sans overflow-hidden">
      {/* ── SIDEBAR (Mocked to match dashboard structure) ── */}
      <aside className="w-72 h-screen border-r border-slate-800 bg-slate-900 hidden md:flex flex-col z-50 sticky top-0 shrink-0">
        <div className="p-5 border-b border-slate-800">
          <Logo />
        </div>
        <div className="p-5 flex-1 flex flex-col gap-6">
          <button onClick={() => navigate('/dashboard?mode=exam')} className="flex items-center gap-2 text-slate-500 hover:text-slate-300 transition-colors group text-xs font-bold uppercase tracking-[0.18em]">
            <Icon.ArrowLeft className="w-3.5 h-3.5 group-hover:-translate-x-0.5 transition-transform" />
            Back to Dashboard
          </button>

          <div className="rounded-[28px] border border-purple-500/15 bg-linear-to-br from-purple-500/12 to-slate-900 p-5">
            <div className="w-11 h-11 rounded-2xl bg-purple-500/15 border border-purple-500/20 text-purple-400 flex items-center justify-center mb-4">
              <Icon.Layers className="w-5 h-5" />
            </div>
            <div className="text-[10px] font-black uppercase tracking-[0.2em] text-purple-400 mb-3">Interview Pattern</div>
            <h3 className="text-lg font-black text-white leading-tight mb-3">Product-Based Sprint</h3>
            <p className="text-sm leading-6 text-slate-400">
              Fast-paced simulations tuned for OA filtering rounds with stronger DSA pressure and tighter execution windows.
            </p>
          </div>

          <div className="space-y-3">
            <div className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-600">Quick Context</div>
            {productSidebarStats.map((item) => (
              <div key={item.label} className="rounded-2xl border border-white/8 bg-white/5 px-4 py-4">
                <div className="text-[10px] font-black uppercase tracking-[0.18em] text-slate-500 mb-2">{item.label}</div>
                <div className="text-sm font-bold text-white">{item.value}</div>
              </div>
            ))}
          </div>

          <div className="mt-auto rounded-2xl border border-white/8 bg-slate-950/60 p-4">
            <div className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-500 mb-2">Best For</div>
            <p className="text-sm leading-6 text-slate-400">
              Learners preparing for Google, Amazon, Microsoft, and Meta online screening rounds.
            </p>
          </div>
        </div>
      </aside>

      {/* ── MAIN ── */}
      <div className="flex-1 flex flex-col min-w-0 overflow-y-auto">
        <header className="h-14 border-b border-slate-800 flex items-center justify-between px-6 bg-slate-900/60 backdrop-blur-md shrink-0">
          <div className="flex items-center gap-2 text-sm">
            <span className="text-slate-500">Dashboard</span>
            <span className="text-slate-700">/</span>
            <span className="text-slate-500">Interview Prep</span>
            <span className="text-slate-700">/</span>
            <span className="text-slate-200 font-medium">Product Based</span>
          </div>
        </header>

        <div className="p-6 max-w-6xl mx-auto w-full">
          <div>
            <button onClick={() => navigate('/dashboard?mode=exam')}
              className="mb-6 flex items-center gap-2 text-slate-400 hover:text-white transition-colors text-sm font-medium">
              <Icon.ArrowLeft className="w-4 h-4" /> Back to Practice
            </button>
            <motion.div
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              className="mb-8 rounded-[32px] border border-purple-500/20 bg-linear-to-br from-purple-500/14 via-slate-900 to-slate-950 p-8 relative overflow-hidden"
            >
              <div className="absolute right-[-10%] top-[-15%] h-40 w-40 rounded-full bg-purple-500/15 blur-3xl" />
              <div className="relative z-10 flex flex-col lg:flex-row lg:items-end lg:justify-between gap-8">
                <div className="max-w-2xl">
                  <div className="mb-5 flex items-center gap-4">
                    <div className="w-14 h-14 rounded-2xl bg-purple-500/15 text-purple-400 flex items-center justify-center border border-purple-500/25 shadow-lg shadow-purple-500/10">
                      <Icon.BookOpen className="w-7 h-7" />
                    </div>
                    <div>
                      <h1 className="text-3xl font-black text-white tracking-tight">Product-Based Companies</h1>
                      <p className="text-sm text-slate-400">{productCompanies.length} mock options curated for OA-style rounds</p>
                    </div>
                  </div>

                  <p className="text-sm leading-7 text-slate-300 max-w-xl">
                    Train like a real product-company candidate: tighter time pressure, sharper DSA filtering, and interview-style problem framing modeled after top-tier online assessments.
                  </p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 min-w-0 lg:min-w-[420px]">
                  {productInsights.map((item) => (
                    <div key={item.label} className="rounded-2xl border border-white/8 bg-white/5 px-4 py-4">
                      <div className="text-[10px] font-black uppercase tracking-[0.22em] text-slate-500 mb-2">{item.label}</div>
                      <div className="text-sm font-bold text-white">{item.value}</div>
                    </div>
                  ))}
                </div>
              </div>
            </motion.div>
            
            <div className="grid gap-4 max-w-5xl">
              {productCompanies.map((id, index) => {
                const company = companyConfig[id];
                return (
                  <motion.div
                    key={company.id}
                    initial={{ opacity: 0, y: 18 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.05 }}
                    onClick={() => navigate(`/product-assessment?company=${company.id}`)}
                    className="rounded-[28px] border border-slate-800 bg-slate-900/80 hover:border-purple-500/40 hover:bg-slate-900 cursor-pointer transition-all group overflow-hidden"
                  >
                    <div className="p-5 sm:p-6 flex flex-col xl:flex-row xl:items-center xl:justify-between gap-5">
                      <div className="flex items-start gap-4 sm:gap-5">
                        <div className="w-12 h-12 rounded-2xl bg-slate-800 border border-slate-700 flex items-center justify-center text-slate-300 text-2xl font-black shrink-0">
                        {index + 1}
                        </div>
                        <div className="w-12 h-12 rounded-2xl shrink-0 bg-white p-2 border border-slate-200/10 shadow-lg shadow-black/20">
                          <img src={company.logo} alt={company.name} className="w-full h-full object-contain" />
                        </div>
                        <div className="min-w-0">
                          <div className="flex flex-wrap items-center gap-2 mb-2">
                            <span className="text-[10px] font-black uppercase tracking-[0.2em] text-purple-400">Simulation Track</span>
                            <span className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-600">Product OA</span>
                          </div>
                          <div className="text-xl font-black text-white group-hover:text-purple-400 transition-colors">
                            {company.name} Online Challenge
                          </div>
                          <p className="text-sm text-slate-400 mt-2 max-w-2xl">
                            Expect tighter constraints, stronger DSA weighting, and faster decision-making patterns similar to real screening rounds.
                          </p>
                        </div>
                      </div>

                      <div className="flex flex-col sm:flex-row sm:items-center gap-4 sm:gap-6 xl:min-w-[320px] xl:justify-end">
                        <div className="grid grid-cols-2 gap-3 text-left">
                          <div className="rounded-2xl bg-white/5 border border-white/8 px-4 py-3">
                            <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.2em] text-slate-500 mb-2">
                              <Icon.Clock className="w-3.5 h-3.5" />
                              Pace
                            </div>
                            <div className="text-sm font-bold text-white">75 mins</div>
                          </div>
                          <div className="rounded-2xl bg-white/5 border border-white/8 px-4 py-3">
                            <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.2em] text-slate-500 mb-2">
                              <Icon.Spark className="w-3.5 h-3.5" />
                              Focus
                            </div>
                            <div className="text-sm font-bold text-white">Arrays + Graphs</div>
                          </div>
                        </div>

                        <div className="flex items-center gap-3 self-end sm:self-auto">
                          <span className={`text-xs px-3 py-1 rounded-xl border font-semibold ${diffBadge("Hard")}`}>Hard</span>
                          <div className="w-11 h-11 rounded-2xl border border-white/10 bg-white/5 flex items-center justify-center">
                            <Icon.ChevronRight className="w-5 h-5 text-slate-500 group-hover:text-purple-400 transition-colors" />
                          </div>
                        </div>
                      </div>
                    </div>
                  </motion.div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProductCompanySelection;
