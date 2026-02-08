import React, { useState } from "react";

const questions = [
  "What is your learning goal?",
  "Which domain interests you?",
  "What is your experience level?",
  "What is your purpose?"
];

const AssistantChat = () => {
  const [step, setStep] = useState(0);
  const [answers, setAnswers] = useState([]);
  const [input, setInput] = useState("");

  const nextStep = () => {
    setAnswers([...answers, input]);
    setInput("");
    setStep(step + 1);
  };

  return (
    <div className="fixed bottom-24 right-6 w-80 bg-slate-900 border border-slate-700 rounded-xl p-4">

      {step < questions.length ? (
        <>
          <p className="text-cyan-400">
            {questions[step]}
          </p>

          <input
            className="w-full mt-3 p-2 rounded bg-slate-800 text-white"
            value={input}
            onChange={(e) => setInput(e.target.value)}
          />

          <button
            onClick={nextStep}
            className="mt-3 bg-cyan-500 px-4 py-2 rounded text-black"
          >
            Next
          </button>
        </>
      ) : (
        <p className="text-green-400">
          Setup Complete ✅
        </p>
      )}
    </div>
  );
};

export default AssistantChat;
