import { motion } from "framer-motion";

const FinalCTA = () => {
  return (
    <section className="py-28 px-8 bg-[#111827]">
      <div className="max-w-3xl mx-auto text-center">

        <motion.div
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          viewport={{ once: true }}
        >
          <h2 className="text-3xl md:text-4xl font-semibold tracking-tight">
            Start building mastery with structure.
          </h2>

          <p className="mt-6 text-lg text-[#9CA3AF]">
            Experience coordinated AI learning built for clarity,
            adaptation and long-term understanding.
          </p>

          <button
            className="mt-10 bg-[#22D3EE]
                       text-black px-6 py-3
                       rounded-md text-sm font-medium
                       hover:opacity-90 transition"
          >
            Begin assessment
          </button>
        </motion.div>

      </div>
    </section>
  );
};

export default FinalCTA;
