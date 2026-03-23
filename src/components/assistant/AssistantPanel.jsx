import { useState } from "react";
import AssistantFlow from "./AssistantFlow";
import AssistantChat from "./AssistantChat";

const AssistantPanel = ({ onClose }) => {
  const [activeTab, setActiveTab] = useState("tutor"); // Default to 'tutor' for testing the new agent

  return (
    <div className="fixed bottom-24 right-6 w-[450px]
                    bg-[#0F172A]
                    border border-white/10
                    rounded-2xl shadow-2xl
                    p-0 overflow-hidden z-50 flex flex-col h-[600px]">

      {/* Header */}
      <div className="flex justify-between items-center p-4 bg-slate-900 border-b border-white/5 shrink-0">
        <div className="flex items-center gap-2">
           <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></div>
           <h3 className="text-white font-bold tracking-wide">AI Assistant</h3>
        </div>
        <button
          onClick={onClose}
          className="text-slate-400 hover:text-white transition-colors p-1 hover:bg-white/5 rounded-lg"
        >
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-white/5 bg-slate-900/50 shrink-0">
          <button 
            onClick={() => setActiveTab("tutor")}
            className={`flex-1 py-3 text-xs font-bold uppercase tracking-wider transition-colors ${
                activeTab === "tutor" ? "text-blue-400 border-b-2 border-blue-400 bg-white/5" : "text-slate-500 hover:text-slate-300 hover:bg-white/5"
            }`}
          >
            Teacher Agent
          </button>
          <button 
            onClick={() => setActiveTab("chat")}
            className={`flex-1 py-3 text-xs font-bold uppercase tracking-wider transition-colors ${
                activeTab === "chat" ? "text-blue-400 border-b-2 border-blue-400 bg-white/5" : "text-slate-500 hover:text-slate-300 hover:bg-white/5"
            }`}
          >
            Chat Flow
          </button>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-hidden relative">
          {activeTab === "tutor" ? <AssistantChat /> : <AssistantFlow />}
      </div>

    </div>
  );
};

export default AssistantPanel;
