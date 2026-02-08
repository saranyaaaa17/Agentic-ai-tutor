import { motion } from "framer-motion";

const steps = [
  "Question",
  "Response",
  "Evaluation",
  "Adaptation",
  "Mastery"
];

const LearningFlowStory = () => {
  return (
    <section className="py-32 px-6 bg-black/40">
      <h2 className="text-4xl font-bold text-center mb-16">
        The Adaptive Learning Loop
      </h2>

      <div className="flex flex-wrap justify-center gap-10">
        {steps.map((step, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, scale: 0.8 }}
            whileInView={{ opacity: 1, scale: 1 }}
            className="bg-slate-900 px-8 py-4 rounded-full border border-slate-700"
          >
            {step}
          </motion.div>
        ))}
      </div>
    </section>
  );
};

export default LearningFlowStory;
