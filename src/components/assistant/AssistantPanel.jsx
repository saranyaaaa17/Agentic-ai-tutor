import AssistantFlow from "./AssistantFlow";
import AssistantChat from "./AssistantChat";

const AssistantPanel = ({ onClose }) => {
  return (
    <div className="fixed bottom-24 right-6 w-96
                    bg-[#0F172A]
                    border border-white/10
                    rounded-xl shadow-2xl
                    p-6 z-50">

      <div className="flex justify-between items-center mb-4">
        <h3 className="text-white font-medium">
          AI Assistant
        </h3>
        <button
          onClick={onClose}
          className="text-[#9CA3AF] hover:text-white"
        >
          ✕
        </button>
      </div>

      <AssistantFlow />
      {/* Later you can toggle to <AssistantChat /> */}

    </div>
  );
};

export default AssistantPanel;
