/**
 * Chat Agent (Frontend Wrapper)
 * Responsibility: Interface with the general /api/chat endpoint.
 */
export const ChatAgent = {
    /**
     * Sends a message to the AI Tutor and gets a response.
     * @param {string} message - The user's query
     * @param {Array} history - Previous messages [{role, content}]
     * @returns {Promise<string>} The AI's response text
     */
    async sendMessage(message, history = []) {
        try {
            const response = await fetch('/api/chat', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ message, history })
            });

            if (!response.ok) {
                const errorData = await response.json().catch(() => ({}));
                throw new Error(errorData.detail || `Server error: ${response.status}`);
            }

            const data = await response.json();
            return data.response;
        } catch (error) {
            console.error("ChatAgent Error:", error);
            throw error;
        }
    }
};
