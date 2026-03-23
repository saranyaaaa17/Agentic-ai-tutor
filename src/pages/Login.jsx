import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { supabase } from "../lib/supabase";
import { useAuth } from "../context/AuthContext";
import { motion, AnimatePresence } from "framer-motion";
import BackButton from "../components/ui/BackButton";

const Login = () => {
  const navigate = useNavigate();
  const { user, signInWithGoogle } = useAuth();
  const [authMethod, setAuthMethod] = useState("email"); // 'email' | 'phone'
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [phone, setPhone] = useState("");
  const [otp, setOtp] = useState("");
  const [otpSent, setOtpSent] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (user) {
      navigate("/dashboard");
    }
  }, [user, navigate]);

  // Email Login
  const handleEmailLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    const { error: loginError } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    if (loginError) setError(loginError.message);
    else navigate("/dashboard");
    setLoading(false);
  };

  // Google Login
  const handleGoogleLogin = async () => {
    setLoading(true);
    setError(null);
    const { error } = await signInWithGoogle();
    if (error) setError(error.message);
    setLoading(false);
  };

  // Phone OTP Login
  const handleSendOtp = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    const { error } = await supabase.auth.signInWithOtp({
      phone: phone,
    });
    if (error) {
      setError(error.message);
    } else {
      setOtpSent(true);
    }
    setLoading(false);
  };

  const handleVerifyOtp = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    const { error } = await supabase.auth.verifyOtp({
      phone: phone,
      token: otp,
      type: 'sms',
    });
    if (error) setError(error.message);
    else navigate("/dashboard");
    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-[#050B14] text-white flex relative overflow-hidden font-sans selection:bg-cyan-500/30">
      
      {/* Absolute Back Button */}
      <div className="absolute top-8 left-8 z-50">
        <BackButton to="/" label="Back to Home" />
      </div>

      {/* Left Panel - Branding */}
      <div className="hidden lg:flex w-1/2 relative items-center justify-center p-12 bg-slate-900 border-r border-white/5">
        <div className="absolute inset-0 bg-[#0F172A]">
           <div className="absolute top-0 left-0 w-full h-[500px] bg-cyan-500/20 blur-[120px] rounded-full pointer-events-none opacity-50 mix-blend-screen" />
           <div className="absolute bottom-0 right-0 w-full h-[500px] bg-blue-600/20 blur-[120px] rounded-full pointer-events-none opacity-50 mix-blend-screen" />
           <div className="absolute inset-0 bg-[url('/grid.svg')] bg-center opacity-20 mask-[linear-gradient(180deg,white,rgba(255,255,255,0))]" />
        </div>

        <div className="relative z-10 max-w-lg">
             <motion.div
               initial={{ opacity: 0, y: 20 }}
               animate={{ opacity: 1, y: 0 }}
               transition={{ duration: 0.8 }}
             >
                <div className="w-20 h-20 rounded-2xl bg-linear-to-br from-cyan-400 to-blue-600 flex items-center justify-center shadow-lg shadow-cyan-500/30 mb-8">
                  <svg className="w-10 h-10 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                  </svg>
                </div>
                <h1 className="text-5xl font-black mb-6 tracking-tight leading-tight">
                  Welcome Back, <br/>
                  <span className="text-transparent bg-clip-text bg-linear-to-r from-cyan-400 to-blue-500">Learner.</span>
                </h1>
                <p className="text-slate-400 text-lg leading-relaxed mb-8">
                  Your personalized AI Tutor is ready to help you continue. Log in to access your learning dashboard.
                </p>
                
                <div className="flex gap-4">
                   <div className="bg-slate-800/50 backdrop-blur-md p-4 rounded-xl border border-white/10 flex items-center gap-3">
                      <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
                      <span className="text-sm font-medium text-slate-300">System Online</span>
                   </div>
                   <div className="bg-slate-800/50 backdrop-blur-md p-4 rounded-xl border border-white/10 flex items-center gap-3">
                      <svg className="w-4 h-4 text-cyan-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                           <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                      </svg>
                      <span className="text-sm font-medium text-slate-300">Secure Connection</span>
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
                 {/* Google Login */}
                 <button
                    onClick={handleGoogleLogin}
                    disabled={loading}
                    className="w-full bg-white text-slate-900 font-bold py-3.5 rounded-xl hover:bg-slate-100 transition-all flex items-center justify-center gap-3 mb-6 shadow-lg shadow-white/5"
                 >
                   <svg className="w-5 h-5" viewBox="0 0 24 24">
                      <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
                      <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
                      <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
                      <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
                   </svg>
                   Continue with Google
                 </button>

                 <div className="relative flex py-5 items-center">
                    <div className="grow border-t border-slate-700"></div>
                    <span className="shrink mx-4 text-slate-500 text-xs uppercase tracking-widest font-bold">Or continue with</span>
                    <div className="grow border-t border-slate-700"></div>
                 </div>

                 {/* Tabs */}
                 <div className="flex bg-slate-950/50 p-1 rounded-xl mb-6 border border-white/5">
                    <button 
                       onClick={() => setAuthMethod('email')}
                       className={`flex-1 py-2 text-sm font-bold rounded-lg transition-all ${authMethod === 'email' ? 'bg-slate-800 text-white shadow-sm' : 'text-slate-500 hover:text-slate-300'}`}
                    >
                       Email
                    </button>
                    <button 
                       onClick={() => setAuthMethod('phone')}
                       className={`flex-1 py-2 text-sm font-bold rounded-lg transition-all ${authMethod === 'phone' ? 'bg-slate-800 text-white shadow-sm' : 'text-slate-500 hover:text-slate-300'}`}
                    >
                       Phone
                    </button>
                 </div>

                 {error && (
                    <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="mb-4 p-3 bg-red-500/10 border border-red-500/30 rounded-lg text-red-500 text-sm font-medium flex items-center gap-2">
                       <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                       {error}
                    </motion.div>
                 )}

                 {authMethod === 'email' ? (
                    <form onSubmit={handleEmailLogin} className="space-y-4">
                        <div>
                          <label className="block text-xs font-bold text-slate-400 mb-1 uppercase tracking-wider">Email Address</label>
                          <input
                            type="email"
                            required
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            className="w-full bg-slate-950 border border-slate-700 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 transition-all placeholder:text-slate-600"
                            placeholder="you@example.com"
                          />
                        </div>
                        <div>
                          <label className="block text-xs font-bold text-slate-400 mb-1 uppercase tracking-wider">Password</label>
                          <div className="relative">
                            <input
                              type={showPassword ? "text" : "password"}
                              required
                              value={password}
                              onChange={(e) => setPassword(e.target.value)}
                              className="w-full bg-slate-950 border border-slate-700 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 transition-all placeholder:text-slate-600 pr-10"
                              placeholder="••••••••"
                            />
                            <button
                              type="button"
                              onClick={() => setShowPassword(!showPassword)}
                              className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-white transition-colors"
                            >
                              {showPassword ? (
                                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
                                </svg>
                              ) : (
                                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                                </svg>
                              )}
                            </button>
                          </div>
                        </div>
                        <button
                          type="submit"
                          disabled={loading}
                          className="w-full bg-linear-to-r from-cyan-500 to-blue-600 text-white font-bold py-3.5 rounded-xl hover:opacity-90 transition-all shadow-lg shadow-cyan-500/20 disabled:opacity-50 mt-2"
                        >
                          {loading ? "Authenticating..." : "Sign In"}
                        </button>
                    </form>
                 ) : (
                    <form onSubmit={otpSent ? handleVerifyOtp : handleSendOtp} className="space-y-4">
                        {!otpSent ? (
                            <div>
                                <label className="block text-xs font-bold text-slate-400 mb-1 uppercase tracking-wider">Mobile Number</label>
                                <input
                                  type="tel"
                                  required
                                  value={phone}
                                  onChange={(e) => setPhone(e.target.value)}
                                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 transition-all placeholder:text-slate-600"
                                  placeholder="+91 99999 99999"
                                />
                                <p className="text-xs text-slate-500 mt-2">We will send you a One Time Password via SMS.</p>
                            </div>
                        ) : (
                            <div>
                                <label className="block text-xs font-bold text-slate-400 mb-1 uppercase tracking-wider">Enter OTP</label>
                                <input
                                  type="text"
                                  required
                                  value={otp}
                                  onChange={(e) => setOtp(e.target.value)}
                                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 transition-all placeholder:text-slate-600 tracking-[0.5em] text-center font-mono text-lg"
                                  placeholder="000000"
                                />
                            </div>
                        )}
                        
                        <button
                          type="submit"
                          disabled={loading}
                          className="w-full bg-linear-to-r from-cyan-500 to-blue-600 text-white font-bold py-3.5 rounded-xl hover:opacity-90 transition-all shadow-lg shadow-cyan-500/20 disabled:opacity-50 mt-2"
                        >
                          {loading ? "Processing..." : otpSent ? "Verify OTP" : "Send Code"}
                        </button>
                        
                        {otpSent && (
                           <button 
                             type="button" 
                             onClick={() => setOtpSent(false)} 
                             className="w-full text-xs text-cyan-400 hover:text-cyan-300 mt-2 hover:underline"
                           >
                              Change Phone Number
                           </button>
                        )}
                    </form>
                 )}

                 <div className="mt-8 text-center text-sm text-slate-400">
                   Don't have an account?{" "}
                   <Link to="/signup" className="text-cyan-400 hover:text-cyan-300 font-bold hover:underline">
                     Create Account
                   </Link>
                 </div>
              </motion.div>
          </div>
      </div>
    </div>
  );
};

export default Login;
