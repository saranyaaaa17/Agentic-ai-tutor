
/**
 * Code Execution Utility routed through the local backend API.
 */
export const executeCode = async (language, code, stdin = "") => {
    try {
        const response = await fetch('/api/code/execute', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                language,
                code,
                stdin
            })
        });

        if (!response.ok) {
            const errorData = await response.json().catch(() => null);
            throw new Error(errorData?.detail || `Execution failed: ${response.statusText}`);
        }

        return await response.json();
    } catch (error) {
        console.error("Code Execution Error:", error);
        return {
            output: "",
            error: error.message || "Failed to connect to compiler service.",
            code: 1
        };
    }
};
