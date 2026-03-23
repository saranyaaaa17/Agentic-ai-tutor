
import { questionBank } from "../data/questionBank";
import { ensureQuestionHints } from "./questionEnhancers";

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
    console.log(`[AssessmentUtils] 📦 Serving STATIC questions for domain: "${domain}"`);
    const allQuestions = questionBank[domain] || [];
    
    // If question bank is empty, return placeholder questions
    if (allQuestions.length === 0) {
        console.warn(`[AssessmentUtils] ⚠️ Question bank is empty for domain "${domain}". Returning placeholders.`);
        return Array.from({ length: count }, (_, i) => ({
            id: `placeholder_${i + 1}`,
            q: `Question ${i + 1}: Waiting for AI to generate questions for ${domain}...`,
            options: [
                "Please wait - AI is generating questions",
                "Backend server must be running",
                "Check if /api/teach is accessible",
                "This is a fallback placeholder"
            ],
            ans: "Please wait - AI is generating questions",
            difficulty: "medium"
        }));
    }

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
    
    return ensureQuestionHints(selected, domain);
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

// Calculate Mastery Score
// Uses weighted average: 70% previous + 30% current (if correct)
// Decreases if wrong (by retaining only 70% of previous)
export const updateMasteryScore = (previousMastery, isCorrect, attempts = 0) => {
    let newMastery = previousMastery * 0.7 + (isCorrect ? 0.3 : 0.0);
    
    // Ensure boundaries
    newMastery = Math.max(0, Math.min(1, newMastery));
    
    return {
        mastery: Math.round(newMastery * 100) / 100,
        attempts: attempts + 1
    };
};
