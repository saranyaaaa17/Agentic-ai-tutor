import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Link } from "react-router-dom";
import { supabase } from "../../lib/supabase";
import { useAuth } from "../../context/AuthContext";
import { useSettings } from "../../context/SettingsContext";
import Logo from "./logo";

const Navbar = () => {
  const { user } = useAuth();
  const { appearance, setAppearance } = useSettings();
  const [openMenu, setOpenMenu] = useState(false);
  const menuRef = useRef(null);

  const initial = (user?.user_metadata?.display_name || user?.email)?.charAt(0).toUpperCase();

  const handleLogout = async () => {
    await supabase.auth.signOut();
    setOpenMenu(false);
  };

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target)) {
        setOpenMenu(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  return (
    <>
      <motion.nav
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: "easeOut" }}
        className="fixed top-0 w-full z-50 px-6 py-4"
      >
        <div className="max-w-7xl mx-auto flex items-center justify-between md:grid md:grid-cols-3">
          
          {/* Logo */}
          <div className="flex justify-start">
            <Logo />
          </div>

          {/* Pill-shaped Navigation Container */}
          <div className="hidden md:flex justify-center">
            <div className="flex items-center gap-1 
                            bg-[#0F1B2E]/80 backdrop-blur-xl 
                            border border-white/10
                            rounded-full px-2 py-2
                            shadow-lg shadow-black/20">
              {['Home', 'About', 'Workflow', 'Features', 'Premium'].map((item) => (
                <a 
                  key={item} 
                  href={`#${item.toLowerCase()}`} 
                  className="relative px-6 py-2 text-sm font-medium 
                              text-slate-300 
                              rounded-full transition-all duration-300
                              hover:bg-cyan-500/10 hover:text-cyan-400
                              group"
                >
                    {item.toUpperCase()}
                </a>
              ))}
            </div>
          </div>

          {/* Auth Section */}
          <div className="flex justify-end">
            {user ? (
              <div className="relative" ref={menuRef}>

                {/* Profile Badge */}
                <button
                  onClick={() => setOpenMenu(!openMenu)}
                  className={`w-10 h-10 rounded-full
                            bg-linear-to-br from-cyan-500/20 to-blue-500/20
                            border ${openMenu ? 'border-cyan-400 ring-2 ring-cyan-500/30' : 'border-transparent'}
                            text-cyan-400
                            font-bold text-sm
                            flex items-center justify-center
                            shadow-[0_0_15px_rgba(6,182,212,0.3)]
                            hover:bg-cyan-500/30 hover:shadow-[0_0_25px_rgba(6,182,212,0.5)]
                            hover:scale-105 active:scale-95
                            transition-all duration-300
                            relative before:absolute before:inset-0 before:rounded-full before:p-px before:bg-linear-to-br before:from-cyan-400 before:to-blue-600 before:-z-10 before:content-['']`}
                >
                  <span className="relative z-10">{initial}</span>
                </button>

                {/* Dropdown */}
                <AnimatePresence>
                  {openMenu && (
                    <motion.div
                      initial={{ opacity: 0, y: -8, scale: 0.95 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, y: -8, scale: 0.95 }}
                      transition={{ duration: 0.18 }}
                      className="absolute right-0 mt-4 w-72
                                bg-[#0F172A]/95
                                backdrop-blur-2xl
                                border border-white/10
                                rounded-2xl
                                shadow-2xl
                                overflow-hidden ring-1 ring-white/5"
                    >
                      {/* User Info Header */}
                      <div className="p-4 border-b border-white/5 bg-white/2">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-full bg-cyan-500/20 flex items-center justify-center text-cyan-400 font-bold border border-cyan-500/30">
                              {initial}
                            </div>
                            <div className="flex-1 overflow-hidden">
                                <p className="text-sm font-bold text-white truncate">
                                  {user?.user_metadata?.display_name || "My Account"}
                                </p>
                                <p className="text-xs text-slate-400 truncate font-medium">
                                  {user.email}
                                </p>
                            </div>
                        </div>
                      </div>

                      {/* Menu Options */}
                      <div className="p-2 space-y-1">
                        <Link to="/profile" onClick={() => setOpenMenu(false)} className="w-full text-left px-3 py-2.5 rounded-xl text-sm text-slate-300 hover:bg-white/5 hover:text-white transition-colors flex items-center gap-3 group">
                          <svg className="w-4 h-4 text-slate-400 group-hover:text-cyan-400 transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                             <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                          </svg>
                          Profile
                        </Link>

                        <Link to="/dashboard" onClick={() => setOpenMenu(false)} className="w-full text-left px-3 py-2.5 rounded-xl text-sm text-slate-300 hover:bg-white/5 hover:text-white transition-colors flex items-center gap-3 group">
                          <svg className="w-4 h-4 text-slate-400 group-hover:text-cyan-400 transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                             <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
                          </svg>
                          Dashboard
                        </Link>

                        <Link to="/home" onClick={() => setOpenMenu(false)} className="w-full text-left px-3 py-2.5 rounded-xl text-sm text-slate-300 hover:bg-white/5 hover:text-white transition-colors flex items-center gap-3 group">
                          <svg className="w-4 h-4 text-slate-400 group-hover:text-cyan-400 transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                             <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
                          </svg>
                          Home
                        </Link>

                        <Link to="/settings" onClick={() => setOpenMenu(false)} className="w-full text-left px-3 py-2.5 rounded-xl text-sm text-slate-300 hover:bg-white/5 hover:text-white transition-colors flex items-center gap-3 group">
                           <svg className="w-4 h-4 text-slate-400 group-hover:text-cyan-400 transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                           </svg>
                           Settings
                        </Link>

                         {/* Theme Toggle Placeholder */}
                        <button onClick={() => document.documentElement.classList.toggle('dark')} className="w-full px-3 py-2.5 flex items-center justify-between text-sm text-slate-300 hover:bg-white/5 rounded-xl transition-colors group">
                           <div className="flex items-center gap-3">
                                <svg className="w-4 h-4 text-slate-400 group-hover:text-cyan-400 transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
                                </svg>
                                Theme
                           </div>
                           <div className="flex bg-slate-800 rounded-full p-1 cursor-pointer">
                                <div className="w-4 h-4 rounded-full bg-cyan-500 shadow-sm"></div>
                                <div className="w-4 h-4"></div>
                           </div>
                        </button>

                        <Link to="/contact" onClick={() => setOpenMenu(false)} className="w-full text-left px-3 py-2.5 rounded-xl text-sm text-slate-300 hover:bg-white/5 hover:text-white transition-colors flex items-center gap-3 group">
                           <svg className="w-4 h-4 text-slate-400 group-hover:text-cyan-400 transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18.364 5.636l-3.536 3.536m0 5.656l3.536 3.536M9.172 9.172L5.636 5.636m3.536 9.192l-3.536 3.536M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-5 0a4 4 0 11-8 0 4 4 0 018 0z" />
                           </svg>
                           Help & Support
                        </Link>

                        <button className="w-full text-left px-3 py-2.5 rounded-xl text-sm text-slate-300 hover:bg-white/5 hover:text-white transition-colors flex items-center gap-3 group">
                           <svg className="w-4 h-4 text-slate-400 group-hover:text-cyan-400 transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
                           </svg>
                           Add Account
                        </button>
                      </div>

                      <div className="p-2 border-t border-white/5">
                        <button
                          onClick={handleLogout}
                          className="w-full text-left px-3 py-2.5 rounded-xl
                                    text-sm text-red-400
                                    hover:bg-red-500/10 hover:text-red-300
                                    transition-colors flex items-center gap-3"
                        >
                          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                          </svg>
                          Sign Out
                        </button>
                      </div>

                    </motion.div>
                  )}
                </AnimatePresence>

              </div>
            ) : (
              <div className="flex items-center gap-4 text-sm">
                <Link
                  to="/login"
                  className="px-5 py-2 text-slate-300 hover:text-white transition font-medium rounded-full hover:bg-white/5"
                >
                  Log in
                </Link>

                <Link
                  to="/signup"
                  className="bg-cyan-500
                            text-black px-6 py-2.5
                            rounded-full font-bold
                            hover:bg-cyan-400 transition
                            shadow-[0_0_20px_rgba(34,211,238,0.3)]
                            hover:shadow-[0_0_30px_rgba(34,211,238,0.5)] 
                            transform hover:scale-105"
                >
                  Sign up free
                </Link>
              </div>
            )}
          </div>
        </div>
      </motion.nav>
    </>
  );
};

export default Navbar;
