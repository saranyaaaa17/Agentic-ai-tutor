
import { questionBank } from "../data/questionBank";

// Fisher-Yates Shuffle
export const shuffleArray = (array) => {
    let currentIndex = array.length, randomIndex;
    while (currentIndex !== 0) {
        randomIndex = Math.floor(Math.random() * currentIndex);
        currentIndex--;
        [array[currentIndex], array[randomIndex]] = [array[randomIndex], array[currentIndex]];
    }
    return array;
};

// Generate Assessment Questions
// Selects a subset of questions (e.g., 5-10) from the bank for a specific domain.
// Attempts to balance difficulty: 40% Easy, 40% Medium, 20% Hard if possible.
export const generateAssessment = (domain, count = 10) => {
    const allQuestions = questionBank[domain] || [];
    if (allQuestions.length === 0) return [];

    let selected = [];
    const uniqueShuffled = shuffleArray([...allQuestions]);
    
    // Helper to clone and rename ID
    const addQuestions = (questions, suffix) => {
        return questions.map(q => ({
            ...q,
            id: suffix ? `${q.id}_${suffix}` : q.id
        }));
    };

    let loops = 0;
    while (selected.length < count) {
        const remainingNeeded = count - selected.length;
        const suffix = loops > 0 ? `copy${loops}` : ""; // First set keeps original IDs
        
        if (remainingNeeded >= uniqueShuffled.length) {
             selected = [...selected, ...addQuestions(uniqueShuffled, suffix)];
        } else {
             selected = [...selected, ...addQuestions(uniqueShuffled.slice(0, remainingNeeded), suffix)];
        }
        loops++;
    }
    
    return selected;
};

// Session Storage Helpers
export const saveAssessmentState = (key, state) => {
    try {
        sessionStorage.setItem(key, JSON.stringify(state));
    } catch (e) {
        console.error("Failed to save assessment state", e);
    }
};

export const loadAssessmentState = (key) => {
    try {
        const saved = sessionStorage.getItem(key);
        return saved ? JSON.parse(saved) : null;
    } catch (e) {
        return null;
    }
};

export const clearAssessmentState = (key) => {
    sessionStorage.removeItem(key);
};
