import { dailyChallenge } from "../data/dailyChallenge";
import { recordLearningActivity } from "./learningActivity";

const STORAGE_KEY = "daily_challenge_state";

const todayKey = () => new Date().toISOString().slice(0, 10);

const previousDayKey = (dateString) => {
  const date = new Date(`${dateString}T00:00:00`);
  date.setDate(date.getDate() - 1);
  return date.toISOString().slice(0, 10);
};

const loadChallengeState = () => {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : { streak: 0, lastSolvedOn: null, solvedChallenges: {} };
  } catch (_) {
    return { streak: 0, lastSolvedOn: null, solvedChallenges: {} };
  }
};

const saveChallengeState = (state) => {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
};

export const getDailyChallengeState = () => {
  const state = loadChallengeState();
  const today = todayKey();
  const challengeStatus = state.solvedChallenges?.[dailyChallenge.id] || {};

  return {
    streak: state.streak || 0,
    solvedToday: challengeStatus.solvedOn === today,
    lastSolvedOn: state.lastSolvedOn || null
  };
};

export const recordDailyChallengeSuccess = () => {
  const state = loadChallengeState();
  const today = todayKey();
  const alreadySolvedToday = state.solvedChallenges?.[dailyChallenge.id]?.solvedOn === today;

  if (alreadySolvedToday) {
    return {
      streak: state.streak || 0,
      solvedToday: true,
      incremented: false
    };
  }

  const nextStreak =
    state.lastSolvedOn === previousDayKey(today) ? (state.streak || 0) + 1 : 1;

  const nextState = {
    streak: nextStreak,
    lastSolvedOn: today,
    solvedChallenges: {
      ...(state.solvedChallenges || {}),
      [dailyChallenge.id]: {
        solvedOn: today
      }
    }
  };

  saveChallengeState(nextState);

  recordLearningActivity({
    type: "challenge_completed",
    title: `Solved ${dailyChallenge.title}`,
    points: dailyChallenge.points,
  });

  return {
    streak: nextStreak,
    solvedToday: true,
    incremented: true
  };
};

export const getDailyChallengeCard = () => {
  const state = getDailyChallengeState();

  return {
    ...dailyChallenge,
    streak: state.streak,
    solvedToday: state.solvedToday,
    timeLeft: "24h 00m"
  };
};
