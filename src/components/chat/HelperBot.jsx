import { useState } from "react";
import { motion } from "framer-motion";

const HelperBot = () => {
  const [open, setOpen] = useState(false);

  return (
    <>
      <motion.button
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        transition={{ delay: 1 }}
        onClick={() => setOpen(!open)}
        className="fixed bottom-6 right-6
                   w-12 h-12 rounded-full
                   bg-gradient-to-br from-cyan-400 to-purple-500
                   flex items-center justify-center
                   shadow-lg hover:scale-110 transition"
      >
        🤖
      </motion.button>

      {open && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="fixed bottom-20 right-6 w-72
                     bg-slate-900 border border-white/10
                     rounded-xl p-4 backdrop-blur-lg"
        >
          <p className="text-gray-300 text-sm">
            Hi 👋 Need help getting started?
          </p>
        </motion.div>
      )}
    </>
  );
};

export default HelperBot;
