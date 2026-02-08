import { useState, useEffect } from "react";
import { supabase } from "../../lib/supabase";
import { useAuth } from "../../context/AuthContext";

const flow = [
  {
    id: "direction",
    question: "What direction are you leaning toward?",
    options: [
      "Software / Coding",
      "Core Engineering",
      "Management / Consulting",
      "Not sure yet"
    ]
  },
  {
    id: "goal",
    question: "What is your current objective?",
    options: [
      "Strengthen fundamentals",
      "Prepare for interviews",
      "Improve problem solving",
      "Academic preparation",
      "Exploring options"
    ]
  },
  {
    id: "timeline",
    question: "Are you preparing for something specific soon?",
    options: [
      "Placement season",
      "Semester exams",
      "Competitive exam",
      "No fixed deadline"
    ]
  }
];

const AssistantFlow = () => {
  const { user } = useAuth();

  const [stepIndex, setStepIndex] = useState(0);
  const [messages, setMessages] = useState([]);
  const [answers, setAnswers] = useState({});
  const [input, setInput] = useState("");

  useEffect(() => {
    setMessages([
      { role: "assistant", text: "Hi 👋 I’ll personalize your learning journey." },
      { role: "assistant", text: flow[0].question }
    ]);
  }, []);

  const handleAnswer = async (value) => {
    const currentStepId = flow[stepIndex].id;

    const updatedAnswers = {
      ...answers,
      [currentStepId]: value
    };

    setAnswers(updatedAnswers);

    const updatedMessages = [
      ...messages,
      { role: "user", text: value }
    ];

    const nextStep = stepIndex + 1;

    if (nextStep < flow.length) {
      updatedMessages.push({
        role: "assistant",
        text: flow[nextStep].question
      });

      setStepIndex(nextStep);
      setMessages(updatedMessages);

    } else {

      updatedMessages.push({
        role: "assistant",
        text: "Got it. Saving your preferences..."
      });

      setMessages(updatedMessages);

      // 🔥 Save to Supabase
      if (user) {
        const { error } = await supabase
          .from("profiles")
          .update({
            direction: updatedAnswers.direction,
            goal: updatedAnswers.goal,
            timeline: updatedAnswers.timeline,
            interests_completed: true
          })
          .eq("id", user.id);

        if (error) {
          console.error("Error saving profile:", error);
        } else {
          console.log("Profile saved successfully");
        }
      }

      updatedMessages.push({
        role: "assistant",
        text: "You're all set. You can now head to Start Learning."
      });

      setMessages(updatedMessages);
    }

    setInput("");
  };

  return (
    <div className="flex flex-col h-full">

      {/* Chat Area */}
      <div className="flex-1 overflow-y-auto space-y-3 pr-2 mb-4">

        {messages.map((msg, i) => (
          <div
            key={i}
            className={`text-sm px-4 py-3 rounded-xl max-w-[85%]
              ${
                msg.role === "assistant"
                  ? "bg-white/5 text-[#E5E7EB]"
                  : "bg-[#22D3EE]/20 text-[#22D3EE] ml-auto"
              }`}
          >
            {msg.text}
          </div>
        ))}

      </div>

      {/* Options */}
      {stepIndex < flow.length && (
        <div className="space-y-2 mb-3">
          {flow[stepIndex].options.map((option, index) => (
            <button
              key={index}
              onClick={() => handleAnswer(option)}
              className="w-full text-left px-4 py-2
                         bg-white/5 rounded-lg
                         hover:bg-white/10 transition text-sm"
            >
              {option}
            </button>
          ))}
        </div>
      )}

      {/* Free Text Input */}
      {stepIndex < flow.length && (
        <div className="flex gap-2">
          <input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Type your response..."
            className="flex-1 bg-[#111827]
                       border border-white/10
                       rounded-md px-3 py-2 text-sm
                       focus:outline-none focus:border-[#22D3EE]"
          />

          <button
            onClick={() => input && handleAnswer(input)}
            className="px-4 py-2 bg-[#22D3EE]
                       text-black rounded-md text-sm"
          >
            Send
          </button>
        </div>
      )}

    </div>
  );
};

export default AssistantFlow;

