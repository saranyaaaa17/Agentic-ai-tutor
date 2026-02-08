import { useAuth } from "../context/AuthContext";
import { motion } from "framer-motion";
import { useNavigate, useSearchParams } from "react-router-dom";

const Dashboard = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const mode = searchParams.get("mode");

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

  const conceptDomains = [
    {
      id: "dsa",
      title: "DSA",
      description: "Master Data Structures and Algorithms.",
      color: "border-cyan-500",
      hoverColor: "hover:border-cyan-400",
      glow: "bg-cyan-500/10",
    },
    {
      id: "programming",
      title: "Programming",
      description: "C++, Java, Python, and more.",
      color: "border-emerald-500",
      hoverColor: "hover:border-emerald-400",
      glow: "bg-emerald-500/10",
    },
    {
      id: "ml",
      title: "Machine Learning",
      description: "AI, Deep Learning, and Neural Networks.",
      color: "border-rose-500",
      hoverColor: "hover:border-rose-400",
      glow: "bg-rose-500/10",
    },
    {
      id: "web",
      title: "Web Development",
      description: "HTML, CSS, React, and Frontend Logic.",
      color: "border-orange-500",
      hoverColor: "hover:border-orange-400",
      glow: "bg-orange-500/10",
    },
    {
      id: "dbms",
      title: "DBMS",
      description: "SQL, NoSQL, and Database Design.",
      color: "border-blue-500",
      hoverColor: "hover:border-blue-400",
      glow: "bg-blue-500/10",
    },
    {
      id: "os",
      title: "Operating Systems",
      description: "Processes, Threads, and Concurrency.",
      color: "border-gray-500",
      hoverColor: "hover:border-gray-400",
      glow: "bg-gray-500/10",
    },
  ];

  const problemDomains = [
    {
      id: "programming-problems",
      title: "Programming",
      description: "Practice coding problems across various difficulty levels.",
      color: "border-green-500",
      hoverColor: "hover:border-green-400",
      glow: "bg-green-500/10",
    },
    {
      id: "dsa-problems",
      title: "Data Structures",
      description: "Solve problems related to arrays, trees, graphs, and more.",
      color: "border-teal-500",
      hoverColor: "hover:border-teal-400",
      glow: "bg-teal-500/10",
    },
    {
      id: "sql-problems",
      title: "SQL Challenges",
      description: "Write complex queries, joins, and optimizations.",
      color: "border-yellow-500",
      hoverColor: "hover:border-yellow-400",
      glow: "bg-yellow-500/10",
    },
    {
      id: "logic-problems",
      title: "Logical Reasoning",
      description: "Puzzles, pattern matching, and analytical problems.",
      color: "border-pink-500",
      hoverColor: "hover:border-pink-400",
      glow: "bg-pink-500/10",
    },
  ];

  const examDomains = [
    {
      id: "product-based",
      title: "Product Based Companies",
      description: "Prepare for product-based company interviews (FAANG + Startups).",
      color: "border-purple-500",
      hoverColor: "hover:border-purple-400",
      glow: "bg-purple-500/10",
    },
    {
      id: "service-based",
      title: "Service Based Companies",
      description: "Prepare for service-based company recruitment processes.",
      color: "border-indigo-500",
      hoverColor: "hover:border-indigo-400",
      glow: "bg-indigo-500/10",
    },
  ];

  if (mode === "concept") {
    return (
      <div className="min-h-screen bg-[#0B1120] text-white p-8 md:p-12 transition-colors duration-500">
        <button 
          onClick={() => navigate("/dashboard")} 
          className="mb-8 text-sm text-gray-400 hover:text-white flex items-center transition-colors group"
        >
          <svg className="w-4 h-4 mr-2 group-hover:-translate-x-1 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
          </svg>
          Back to Selection
        </button>

        <motion.div
           initial={{ opacity: 0, y: -20 }}
           animate={{ opacity: 1, y: 0 }}
           transition={{ duration: 0.5 }}
           className="mb-12"
        >
          <h1 className="text-3xl md:text-4xl font-bold mb-4">
            <span className="text-blue-500">Concept Mastery</span> Domains
          </h1>
          <p className="text-[#9CA3AF] text-lg max-w-2xl">
            Select a domain to begin your deep dive.
          </p>
        </motion.div>

        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
          {conceptDomains.map((domain, index) => (
             <motion.div
              key={index}
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.3, delay: index * 0.1 }}
              whileHover={{ scale: 1.05 }}
              onClick={() => {
                  navigate(`/assessment?domain=${domain.id}`);
              }}
              className={`cursor-pointer group relative overflow-hidden
                          bg-[#0F172A] border ${domain.color} border-opacity-50
                          rounded-xl p-6 flex flex-col justify-between h-64
                          transition-all duration-300 shadow-lg ${domain.hoverColor}`}
            >
               <div className={`absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 ${domain.glow} blur-2xl`} />
               
               <div className="relative z-10">
                 <h2 className="text-xl font-bold mb-3 text-white">{domain.title}</h2>
                 <p className="text-[#9CA3AF] text-sm">{domain.description}</p>
               </div>

               <div className="relative z-10 mt-4 flex justify-end">
                 <div className="p-2 rounded-full bg-white/5 group-hover:bg-white/10 transition-colors">
                    <svg className="w-5 h-5 text-gray-300 group-hover:text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                 </div>
               </div>
            </motion.div>
          ))}
        </div>
      </div>
    );
  }

  if (mode === "problem") {
    return (
      <div className="min-h-screen bg-[#0B1120] text-white p-8 md:p-12 transition-colors duration-500">
        <button 
          onClick={() => navigate("/dashboard")} 
          className="mb-8 text-sm text-gray-400 hover:text-white flex items-center transition-colors group"
        >
          <svg className="w-4 h-4 mr-2 group-hover:-translate-x-1 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
          </svg>
          Back to Selection
        </button>

        <motion.div
           initial={{ opacity: 0, y: -20 }}
           animate={{ opacity: 1, y: 0 }}
           transition={{ duration: 0.5 }}
           className="mb-12"
        >
          <h1 className="text-3xl md:text-4xl font-bold mb-4">
            <span className="text-green-500">Problem Solving</span> Domains
          </h1>
          <p className="text-[#9CA3AF] text-lg max-w-2xl">
            Select a category to practice.
          </p>
        </motion.div>

        <div className="grid md:grid-cols-3 gap-6">
          {problemDomains.map((domain, index) => (
             <motion.div
              key={index}
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.3, delay: index * 0.1 }}
              whileHover={{ scale: 1.05 }}
              onClick={() => navigate(`/problem-assessment?domain=${domain.id}`)}
              className={`cursor-pointer group relative overflow-hidden
                          bg-[#0F172A] border ${domain.color} border-opacity-50
                          rounded-xl p-6 flex flex-col justify-between h-64
                          transition-all duration-300 shadow-lg ${domain.hoverColor}`}
            >
               <div className={`absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 ${domain.glow} blur-2xl`} />
               
               <div className="relative z-10">
                 <h2 className="text-xl font-bold mb-3 text-white">{domain.title}</h2>
                 <p className="text-[#9CA3AF] text-sm">{domain.description}</p>
               </div>

               <div className="relative z-10 mt-4 flex justify-end">
                 <div className="p-2 rounded-full bg-white/5 group-hover:bg-white/10 transition-colors">
                    <svg className="w-5 h-5 text-gray-300 group-hover:text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                 </div>
               </div>
            </motion.div>
          ))}
        </div>
      </div>
    );
  }

  if (mode === "exam") {
    return (
      <div className="min-h-screen bg-[#0B1120] text-white p-8 md:p-12 transition-colors duration-500">
        <button 
          onClick={() => navigate("/dashboard")} 
          className="mb-8 text-sm text-gray-400 hover:text-white flex items-center transition-colors group"
        >
          <svg className="w-4 h-4 mr-2 group-hover:-translate-x-1 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
          </svg>
          Back to Selection
        </button>

        <motion.div
           initial={{ opacity: 0, y: -20 }}
           animate={{ opacity: 1, y: 0 }}
           transition={{ duration: 0.5 }}
           className="mb-12"
        >
          <h1 className="text-3xl md:text-4xl font-bold mb-4">
            <span className="text-purple-500">Exam Preparation</span> Tracks
          </h1>
          <p className="text-[#9CA3AF] text-lg max-w-2xl">
            Choose your target company type.
          </p>
        </motion.div>

        <div className="grid md:grid-cols-2 gap-6 max-w-4xl">
          {examDomains.map((domain, index) => (
             <motion.div
              key={index}
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.3, delay: index * 0.1 }}
              whileHover={{ scale: 1.05 }}
              onClick={() => navigate(domain.id === 'product-based' ? '/product-selection' : '/service-selection')}
              className={`cursor-pointer group relative overflow-hidden
                          bg-[#0F172A] border ${domain.color} border-opacity-50
                          rounded-xl p-6 flex flex-col justify-between h-64
                          transition-all duration-300 shadow-lg ${domain.hoverColor}`}
            >
               <div className={`absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 ${domain.glow} blur-2xl`} />
               
               <div className="relative z-10">
                 <h2 className="text-2xl font-bold mb-3 text-white">{domain.title}</h2>
                 <p className="text-[#9CA3AF] text-base">{domain.description}</p>
               </div>

               <div className="relative z-10 mt-4 flex justify-end">
                 <div className="p-2 rounded-full bg-white/5 group-hover:bg-white/10 transition-colors">
                    <svg className="w-6 h-6 text-gray-300 group-hover:text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                 </div>
               </div>
            </motion.div>
          ))}
        </div>
      </div>
    );
  }

  if (mode) {
    return (
      <div className="min-h-screen bg-[#0B1120] text-white p-12">
        <button 
          onClick={() => navigate("/dashboard")} 
          className="mb-8 text-sm text-gray-400 hover:text-white flex items-center transition-colors"
        >
          <svg className="w-4 h-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
          </svg>
          Back to Selection
        </button>
        <h1 className="text-3xl font-bold mb-4 capitalize">{mode.replace('-', ' ')} Mode</h1>
        <p className="text-gray-400">Content for {mode} would appear here.</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0B1120] text-white flex flex-col p-8 md:p-12">
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="mb-12"
      >
        <h1 className="text-4xl md:text-5xl font-bold">
          Welcome, <span className="text-blue-500">{user?.user_metadata?.display_name || user?.email?.split('@')[0] || "Learner"}</span>
        </h1>
        <p className="text-[#9CA3AF] text-lg mt-4 max-w-2xl">
          What would you like to focus on today?
        </p>
      </motion.div>

      <div className="flex-1 flex items-center justify-center">
        <div className="grid md:grid-cols-3 gap-8 w-full max-w-7xl">
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
                          rounded-2xl p-8 flex flex-col justify-between h-96
                          transition-all duration-300 shadow-xl ${option.hoverColor}`}
            >
              <div className={`absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 ${option.glow} blur-2xl`} />

              <div className="relative z-10">
                <h2 className="text-3xl font-bold mb-6 text-white">
                  {option.title}
                </h2>
                <p className="text-[#9CA3AF] text-lg leading-relaxed">
                  {option.description}
                </p>
              </div>

              <div className="relative z-10 mt-6 flex items-center text-sm font-medium text-white/50 group-hover:text-white transition-colors">
                <span>Start Now</span>
                <svg className="w-5 h-5 ml-2 group-hover:translate-x-1 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
                </svg>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
