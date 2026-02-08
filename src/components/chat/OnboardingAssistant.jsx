import { useState } from "react";

const steps = [
  "What do you want to learn?",
  "Which domain interests you?",
  "What is your experience level?",
  "What is your learning goal?"
];

const OnboardingAssistant = () => {
  const [step, setStep] = useState(0);
  const [answers, setAnswers] = useState([]);
  const [input, setInput] = useState("");

  const handleNext = () => {
    if (!input) return;

    setAnswers([...answers, input]);
    setInput("");
    setStep(step + 1);
  };

  return (
    <div className="fixed bottom-24 right-6 w-80 bg-slate-900 border border-white/10 rounded-xl p-4 shadow-xl">

      {step < steps.length ? (
        <>
          <h3 className="text-cyan-400 font-semibold">
            AI Onboarding Assistant
          </h3>

          <p className="text-gray-300 mt-3">
            {steps[step]}
          </p>

          <input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            className="w-full mt-4 p-2 rounded bg-slate-800 text-white"
          />

          <button
            onClick={handleNext}
            className="mt-3 bg-cyan-500 px-4 py-2 rounded text-black font-semibold"
          >
            Next
          </button>
        </>
      ) : (
        <p className="text-green-400">
          Setup Complete 🎉
        </p>
      )}
    </div>
  );
};

export default OnboardingAssistant;
