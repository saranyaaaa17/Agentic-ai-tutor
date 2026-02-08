import Navbar from "../components/layout/Navbar";
import { motion } from "framer-motion";

const Settings = () => {
    
    const settingsSections = [
        {
            title: "General",
            icon: (
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4" />
                </svg>
            ),
            items: ["Language", "Time Zone", "Region"]
        },
        {
            title: "Notifications",
            icon: (
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                </svg>
            ),
            items: ["Email Notifications", "Push Notifications", "Weekly Digest"]
        },
         {
            title: "Privacy & Security",
            icon: (
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                     <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                </svg>
            ),
            items: ["Change Password", "Two-Factor Authentication", "Active Sessions"]
        }
    ];

  return (
    <div className="min-h-screen bg-slate-950 text-white font-sans selection:bg-cyan-500/30">
      <Navbar />

      <div className="max-w-4xl mx-auto pt-32 px-6 pb-20">
        <div className="mb-10">
            <h1 className="text-3xl font-bold mb-2">Settings</h1>
            <p className="text-slate-400">Manage your preferences and account settings.</p>
        </div>

        <div className="space-y-6">
            {settingsSections.map((section, idx) => (
                <motion.div 
                    key={section.title}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: idx * 0.1 }}
                    className="bg-slate-900/50 backdrop-blur-xl border border-white/5 rounded-2xl overflow-hidden"
                >
                    <div className="px-6 py-4 border-b border-white/5 flex items-center gap-3 bg-white/2">
                        <div className="text-cyan-400">{section.icon}</div>
                        <h3 className="font-semibold text-slate-200">{section.title}</h3>
                    </div>
                    <div className="p-2">
                        {section.items.map((item) => (
                            <button key={item} className="w-full text-left px-4 py-3 rounded-lg hover:bg-white/5 flex items-center justify-between group transition-colors">
                                <span className="text-slate-300 group-hover:text-white transition-colors">{item}</span>
                                <svg className="w-4 h-4 text-slate-600 group-hover:text-cyan-400 transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                                </svg>
                            </button>
                        ))}
                    </div>
                </motion.div>
            ))}
        </div>
      </div>
    </div>
  );
};

export default Settings;
