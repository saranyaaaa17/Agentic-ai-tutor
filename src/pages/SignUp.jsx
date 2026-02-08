import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { supabase } from "../lib/supabase";
import { motion } from "framer-motion";
import BackButton from "../components/ui/BackButton";

const SignUp = () => {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleSignUp = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const { error: signUpError } = await supabase.auth.signUp({
      email,
      password,
    });

    if (signUpError) {
      setError(signUpError.message);
    } else {
      navigate("/dashboard");
    }
    setLoading(false);
  };

  const handleGoogleSignUp = async () => {
    setLoading(true);
    setError(null);
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: `${window.location.origin}/dashboard`,
      },
    });
    if (error) setError(error.message);
    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-[#050B14] text-white flex relative overflow-hidden font-sans selection:bg-purple-500/30">
      
       {/* Absolute Back Button */}
      <div className="absolute top-8 left-8 z-50">
        <BackButton to="/" label="Back to Home" />
      </div>

       {/* Left Panel - Branding */}
      <div className="hidden lg:flex w-1/2 relative items-center justify-center p-12 bg-slate-900 border-r border-white/5">
        <div className="absolute inset-0 bg-[#0F172A]">
           <div className="absolute top-0 left-0 w-full h-[500px] bg-purple-500/20 blur-[120px] rounded-full pointer-events-none opacity-50 mix-blend-screen" />
           <div className="absolute bottom-0 right-0 w-full h-[500px] bg-pink-600/20 blur-[120px] rounded-full pointer-events-none opacity-50 mix-blend-screen" />
           <div className="absolute inset-0 bg-[url('/grid.svg')] bg-center opacity-20 mask-[linear-gradient(180deg,white,rgba(255,255,255,0))]" />
        </div>

        <div className="relative z-10 max-w-lg">
             <motion.div
               initial={{ opacity: 0, y: 20 }}
               animate={{ opacity: 1, y: 0 }}
               transition={{ duration: 0.8 }}
             >
                <div className="w-20 h-20 rounded-2xl bg-linear-to-br from-purple-400 to-pink-600 flex items-center justify-center shadow-lg shadow-purple-500/30 mb-8">
                  <svg className="w-10 h-10 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
                  </svg>
                </div>
                <h1 className="text-5xl font-black mb-6 tracking-tight leading-tight">
                  Join the <br/>
                  <span className="text-transparent bg-clip-text bg-linear-to-r from-purple-400 to-pink-500">Revolution.</span>
                </h1>
                <p className="text-slate-400 text-lg leading-relaxed mb-8">
                  Create your profile to unlock personalized learning paths, AI-driven assessments, and real-time career analytics.
                </p>
                
                <div className="space-y-4">
                   <div className="flex items-center gap-4 text-slate-300">
                      <div className="w-6 h-6 rounded-full bg-purple-500/20 flex items-center justify-center border border-purple-500/30">
                        <svg className="w-3 h-3 text-purple-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" /></svg>
                      </div>
                      <span>Personalized AI Curriculum</span>
                   </div>
                   <div className="flex items-center gap-4 text-slate-300">
                      <div className="w-6 h-6 rounded-full bg-pink-500/20 flex items-center justify-center border border-pink-500/30">
                        <svg className="w-3 h-3 text-pink-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" /></svg>
                      </div>
                      <span>Simulated Interview Environments</span>
                   </div>
                   <div className="flex items-center gap-4 text-slate-300">
                      <div className="w-6 h-6 rounded-full bg-blue-500/20 flex items-center justify-center border border-blue-500/30">
                        <svg className="w-3 h-3 text-blue-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" /></svg>
                      </div>
                      <span>Real-time Performance Metrics</span>
                   </div>
                </div>
             </motion.div>
        </div>
      </div>

      {/* Right Panel - Auth Form */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-6 sm:p-12 relative">
          <div className="max-w-md w-full">
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="bg-slate-900/50 backdrop-blur-xl border border-white/10 p-8 rounded-3xl shadow-2xl relative overflow-hidden"
              >
                 <h2 className="text-2xl font-bold mb-6 text-center">Create Account</h2>

                 <button
                    onClick={handleGoogleSignUp}
                    disabled={loading}
                    className="w-full bg-white text-slate-900 font-bold py-3.5 rounded-xl hover:bg-slate-100 transition-all flex items-center justify-center gap-3 mb-6 shadow-lg shadow-white/5"
                 >
                   <svg className="w-5 h-5" viewBox="0 0 24 24">
                      <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
                      <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
                      <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
                      <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
                   </svg>
                   Sign up with Google
                 </button>

                 <div className="relative flex py-5 items-center">
                    <div className="grow border-t border-slate-700"></div>
                    <span className="shrink mx-4 text-slate-500 text-xs uppercase tracking-widest font-bold">Or register with email</span>
                    <div className="grow border-t border-slate-700"></div>
                 </div>

                 {error && (
                    <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="mb-4 p-3 bg-red-500/10 border border-red-500/30 rounded-lg text-red-500 text-sm font-medium flex items-center gap-2">
                       <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                       {error}
                    </motion.div>
                 )}

                 <form onSubmit={handleSignUp} className="space-y-4">
                    <div>
                      <label className="block text-xs font-bold text-slate-400 mb-1 uppercase tracking-wider">Email Address</label>
                      <input
                        type="email"
                        required
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        className="w-full bg-slate-950 border border-slate-700 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-purple-500 focus:ring-1 focus:ring-purple-500 transition-all placeholder:text-slate-600"
                        placeholder="agent@example.com"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-slate-400 mb-1 uppercase tracking-wider">Password</label>
                      <input
                        type="password"
                        required
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        className="w-full bg-slate-950 border border-slate-700 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-purple-500 focus:ring-1 focus:ring-purple-500 transition-all placeholder:text-slate-600"
                        placeholder="••••••••"
                      />
                    </div>
                    <button
                      type="submit"
                      disabled={loading}
                      className="w-full bg-linear-to-r from-purple-500 to-pink-600 text-white font-bold py-3.5 rounded-xl hover:opacity-90 transition-all shadow-lg shadow-purple-500/20 disabled:opacity-50 mt-2"
                    >
                      {loading ? "Creating Account..." : "Create Account"}
                    </button>
                 </form>

                 <div className="mt-8 text-center text-sm text-slate-400">
                   Already have an account?{" "}
                   <Link to="/login" className="text-purple-400 hover:text-purple-300 font-bold hover:underline">
                     Sign in
                   </Link>
                 </div>
              </motion.div>
          </div>
      </div>
    </div>
  );
};

export default SignUp;
