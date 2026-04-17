
import { challengesPool } from "../data/dailyChallenge";
import { recordLearningActivity } from "./learningActivity";

const getStorageKey = (userId) => `daily_challenge_state_${userId || 'guest'}`;

// Generates a stable key for today (YYYY-MM-DD)
const todayKey = () => new Date().toISOString().slice(0, 10);

const previousDayKey = (dateString) => {
  const date = new Date(`${dateString}T00:00:00`);
  date.setDate(date.getDate() - 1);
  return date.toISOString().slice(0, 10);
};

// Selects a challenge based on the current date string (stable rotation)
const getTodayChallenge = () => {
    const key = todayKey();
    // Sum of chars in date as a seed
    const seed = key.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
    return challengesPool[seed % challengesPool.length];
};

const loadChallengeState = (userId) => {
  try {
    const raw = localStorage.getItem(getStorageKey(userId));
    return raw ? JSON.parse(raw) : { streak: 0, lastSolvedOn: null, solvedChallenges: {} };
  } catch (_) {
    return { streak: 0, lastSolvedOn: null, solvedChallenges: {} };
  }
};

const saveChallengeState = (userId, state) => {
  localStorage.setItem(getStorageKey(userId), JSON.stringify(state));
};

export const getDailyChallengeState = (userId) => {
  const state = loadChallengeState(userId);
  const today = todayKey();
  const challenge = getTodayChallenge();
  const challengeStatus = state.solvedChallenges?.[challenge.id] || {};

  return {
    streak: state.streak || 0,
    solvedToday: challengeStatus.solvedOn === today,
    lastSolvedOn: state.lastSolvedOn || null
  };
};

export const recordDailyChallengeSuccess = (userId) => {
  const state = loadChallengeState(userId);
  const today = todayKey();
  const challenge = getTodayChallenge();
  const challengeId = challenge.id;
  const alreadySolvedToday = state.solvedChallenges?.[challengeId]?.solvedOn === today;

  if (alreadySolvedToday) {
    return {
      streak: state.streak || 0,
      solvedToday: true,
      incremented: false
    };
  }

  // Check if streak is maintained or reset
  const nextStreak =
    state.lastSolvedOn === previousDayKey(today) ? (state.streak || 0) + 1 : 1;

  const nextState = {
    streak: nextStreak,
    lastSolvedOn: today,
    solvedChallenges: {
      ...(state.solvedChallenges || {}),
      [challengeId]: {
        solvedOn: today
      }
    }
  };

  saveChallengeState(userId, nextState);

  recordLearningActivity(userId, {
    type: "challenge_completed",
    title: `Solved ${challenge.title}`,
    points: challenge.points,
  });

  return {
    streak: nextStreak,
    solvedToday: true,
    incremented: true
  };
};

// Calculates "HHh MMm" remaining until midnight
const calculateTimeLeft = () => {
    const now = new Date();
    const midnight = new Date();
    midnight.setHours(24, 0, 0, 0);
    
    const diff = midnight - now;
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
    
    return `${hours.toString().padStart(2, '0')}h ${minutes.toString().padStart(2, '0')}m`;
};

export const getDailyChallengeCard = (userId) => {
  const state = getDailyChallengeState(userId);
  const challenge = getTodayChallenge();

  return {
    ...challenge,
    streak: state.streak,
    solvedToday: state.solvedToday,
    timeLeft: calculateTimeLeft()
  };
};

// Re-export for direct challenge access if needed
export { getTodayChallenge as dailyChallenge };
