import { motion } from "framer-motion";
import { useState } from "react";
import { supabase } from "../../lib/supabase";

const AuthModal = ({ type = "register", onClose }) => {
  const [form, setForm] = useState({
    email: "",
    password: "",
    confirm: ""
  });

  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMsg("");
    setLoading(true);

    try {
      if (type === "register") {
        if (form.password !== form.confirm) {
          setErrorMsg("Passwords do not match");
          setLoading(false);
          return;
        }

        const { error } = await supabase.auth.signUp({
          email: form.email,
          password: form.password
        });

        if (error) throw error;

        alert("Check your email to confirm registration.");
        onClose();
      }

      if (type === "login") {
        const { error } = await supabase.auth.signInWithPassword({
          email: form.email,
          password: form.password
        });

        if (error) throw error;

        onClose();
      }
    } catch (err) {
      setErrorMsg(err.message);
    }

    setLoading(false);
  };

  const handleGoogleLogin = async () => {
    setLoading(true);
    await supabase.auth.signInWithOAuth({
      provider: "google"
    });
    setLoading(false);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">

      <motion.div
        initial={{ opacity: 0, scale: 0.96 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.25 }}
        className="bg-[#111827] border border-white/10
                   rounded-lg w-full max-w-md p-8"
      >
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-medium">
            {type === "register" ? "Create account" : "Login"}
          </h2>

          <button
            onClick={onClose}
            className="text-[#9CA3AF] hover:text-white transition"
          >
            ✕
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">

          {/* Email */}
          <div>
            <label className="block text-sm text-[#9CA3AF] mb-2">
              Email
            </label>
            <input
              name="email"
              type="email"
              value={form.email}
              onChange={handleChange}
              required
              className="w-full bg-[#0B1120] border border-white/10
                         rounded-md px-4 py-2 text-sm
                         focus:outline-none focus:border-[#22D3EE]"
            />
          </div>

          {/* Password */}
          <div>
            <label className="block text-sm text-[#9CA3AF] mb-2">
              Password
            </label>
            <input
              name="password"
              type="password"
              value={form.password}
              onChange={handleChange}
              required
              className="w-full bg-[#0B1120] border border-white/10
                         rounded-md px-4 py-2 text-sm
                         focus:outline-none focus:border-[#22D3EE]"
            />
          </div>

          {/* Confirm Password */}
          {type === "register" && (
            <div>
              <label className="block text-sm text-[#9CA3AF] mb-2">
                Confirm Password
              </label>
              <input
                name="confirm"
                type="password"
                value={form.confirm}
                onChange={handleChange}
                required
                className="w-full bg-[#0B1120] border border-white/10
                           rounded-md px-4 py-2 text-sm
                           focus:outline-none focus:border-[#22D3EE]"
              />
            </div>
          )}

          {/* Error Message */}
          {errorMsg && (
            <p className="text-sm text-red-400">
              {errorMsg}
            </p>
          )}

          {/* Submit */}
          <button
            type="submit"
            disabled={loading}
            className="w-full bg-[#22D3EE]
                       text-black py-2 rounded-md
                       text-sm font-medium
                       hover:opacity-90 transition
                       disabled:opacity-60"
          >
            {loading
              ? "Please wait..."
              : type === "register"
              ? "Sign up"
              : "Login"}
          </button>

        </form>

        <div className="mt-6 text-center text-sm text-[#9CA3AF]">
          or
        </div>

        {/* Google */}
        <button
          onClick={handleGoogleLogin}
          disabled={loading}
          className="mt-4 w-full border border-white/10
                     py-2 rounded-md text-sm
                     hover:border-white/30 transition
                     disabled:opacity-60"
        >
          Continue with Google
        </button>

      </motion.div>
    </div>
  );
};

export default AuthModal;
