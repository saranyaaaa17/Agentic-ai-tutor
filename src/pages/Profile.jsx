import { useState, useEffect } from "react";
import { useAuth } from "../context/AuthContext";
import { motion } from "framer-motion";
import Navbar from "../components/layout/Navbar";
import { supabase } from "../lib/supabase";

const Profile = () => {
  const { user } = useAuth();
  const [displayName, setDisplayName] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState(null);

  useEffect(() => {
    if (user?.user_metadata?.display_name) {
      setDisplayName(user.user_metadata.display_name);
    }
  }, [user]);

  const initial = (displayName || user?.email)?.charAt(0).toUpperCase();

  const updateProfile = async () => {
    try {
      setLoading(true);
      setMessage(null);

      const { error } = await supabase.auth.updateUser({
        data: { display_name: displayName }
      });

      if (error) throw error;
      setMessage({ type: "success", text: "Profile updated successfully!" });
    } catch (error) {
      console.error("Error updating profile:", error);
      setMessage({ type: "error", text: "Error updating profile. Please try again." });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-white font-sans selection:bg-cyan-500/30">
      <Navbar />
      
      <div className="max-w-4xl mx-auto pt-32 px-6">
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-slate-900/50 backdrop-blur-xl border border-white/10 rounded-3xl p-8 md:p-12 overflow-hidden relative"
        >
            <div className="absolute top-0 left-0 w-full h-32 bg-linear-to-r from-cyan-500/20 to-purple-500/20" />
            
            <div className="relative">
                {/* Header Section */}
                <div className="flex flex-col md:flex-row gap-6 items-center mb-10 relative z-10">
                    <div className="w-24 h-24 md:w-32 md:h-32 rounded-full bg-slate-900 border-4 border-slate-900 shadow-2xl flex items-center justify-center text-4xl font-bold text-cyan-400 shrink-0">
                        {initial}
                    </div>
                    
                    <div className="text-center md:text-left">
                        <h1 className="text-3xl md:text-4xl font-bold mb-1">My Profile</h1>
                        <p className="text-slate-400 font-medium tracking-wide">{user?.email}</p>
                    </div>
                </div>

                {/* Content Section */}
                <div className="relative z-10">
                    {message && (
                        <div className={`mb-6 p-4 rounded-xl text-sm font-medium ${message.type === 'success' ? 'bg-green-500/10 text-green-400 border border-green-500/20' : 'bg-red-500/10 text-red-400 border border-red-500/20'}`}>
                            {message.text}
                        </div>
                    )}

                    <div className="bg-slate-800/50 rounded-2xl border border-white/5 p-6 md:p-8">
                        <h3 className="text-xl font-semibold mb-6 text-slate-200">Account Details</h3>
                        <div className="grid gap-6 max-w-2xl">
                            <div>
                                <label className="block text-sm text-slate-500 mb-2">Display Name</label>
                                <div className="flex gap-4">
                                    <input 
                                        type="text" 
                                        value={displayName}
                                        onChange={(e) => setDisplayName(e.target.value)}
                                        placeholder="Enter your name"
                                        className="flex-1 bg-slate-900/50 border border-white/10 rounded-xl px-4 py-2.5 text-white focus:outline-none focus:border-cyan-500/50 focus:ring-1 focus:ring-cyan-500/50 transition-all placeholder:text-slate-600"
                                    />
                                    <button 
                                        onClick={updateProfile}
                                        disabled={loading}
                                        className="px-6 py-2.5 bg-cyan-500 hover:bg-cyan-400 text-black font-bold rounded-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-[0_0_15px_rgba(34,211,238,0.3)] hover:shadow-[0_0_25px_rgba(34,211,238,0.5)]"
                                    >
                                        {loading ? "Saving..." : "Save"}
                                    </button>
                                </div>
                            </div>
                            


                            <div className="grid grid-cols-2 gap-6">
                                <div>
                                    <label className="block text-sm text-slate-500 mb-2">User ID</label>
                                    <div className="text-slate-400 font-mono text-xs bg-slate-900/30 border border-white/5 rounded-xl px-4 py-2.5 truncate" title={user?.id}>
                                        {user?.id}
                                    </div>
                                </div>
                                <div>
                                    <label className="block text-sm text-slate-500 mb-2">Account Type</label>
                                    <div>
                                        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-cyan-500/10 text-cyan-400 text-xs font-bold border border-cyan-500/20 mt-1">
                                            FREE TIER
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </motion.div>
      </div>
    </div>
  );
};

export default Profile;
