const STORAGE_KEY = "learning_activity_log_v1";

const loadActivityLog = () => {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    const parsed = raw ? JSON.parse(raw) : [];
    return Array.isArray(parsed) ? parsed : [];
  } catch (_) {
    return [];
  }
};

const saveActivityLog = (activities) => {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(activities.slice(0, 100)));
};

const startOfDay = (date) => {
  const next = new Date(date);
  next.setHours(0, 0, 0, 0);
  return next;
};

const getRelativeTimeLabel = (timestamp) => {
  const now = Date.now();
  const diffMs = Math.max(0, now - new Date(timestamp).getTime());
  const hours = Math.floor(diffMs / (1000 * 60 * 60));
  const days = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  if (hours < 1) return "Just now";
  if (hours < 24) return `${hours}h ago`;
  if (days === 1) return "Yesterday";
  return `${days} days ago`;
};

export const recordLearningActivity = (activity) => {
  const nextActivity = {
    id: `${activity.type}_${Date.now()}`,
    timestamp: new Date().toISOString(),
    points: 0,
    ...activity,
  };

  const activities = [nextActivity, ...loadActivityLog()];
  saveActivityLog(activities);
  return nextActivity;
};

export const getLearningVelocityData = () => {
  const activities = loadActivityLog();
  const today = startOfDay(new Date());
  const dayLabels = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

  const days = Array.from({ length: 7 }, (_, index) => {
    const date = new Date(today);
    date.setDate(today.getDate() - (6 - index));
    return {
      key: date.toISOString().slice(0, 10),
      label: dayLabels[(date.getDay() + 6) % 7],
      value: 0,
    };
  });

  const byDay = new Map(days.map((day) => [day.key, day]));

  activities.forEach((activity) => {
    const key = new Date(activity.timestamp).toISOString().slice(0, 10);
    const day = byDay.get(key);
    if (day) {
      day.value += Number(activity.points) || 0;
    }
  });

  const maxValue = Math.max(...days.map((day) => day.value), 0);

  return days.map((day) => ({
    ...day,
    percentage: maxValue > 0 ? Math.max(8, Math.round((day.value / maxValue) * 100)) : 0,
  }));
};

export const getRecentMilestones = (limit = 3) => {
  const iconByType = {
    challenge_completed: "🔥",
    concept_assessment_completed: "📘",
    problem_assessment_completed: "⚡",
  };

  const colorByType = {
    challenge_completed: "text-orange-400",
    concept_assessment_completed: "text-green-400",
    problem_assessment_completed: "text-blue-400",
  };

  return loadActivityLog()
    .slice(0, limit)
    .map((activity) => ({
      title: activity.title,
      time: getRelativeTimeLabel(activity.timestamp),
      icon: iconByType[activity.type] || "✨",
      color: colorByType[activity.type] || "text-purple-400",
    }));
};
export const getStreakCount = () => {
  const activities = loadActivityLog();
  if (activities.length === 0) return 0;

  const dates = [...new Set(activities.map(a => startOfDay(new Date(a.timestamp)).getTime()))]
    .sort((a, b) => b - a);

  let streak = 0;
  const oneDayMs = 24 * 60 * 60 * 1000;
  let currentRef = startOfDay(new Date()).getTime();

  // If last activity wasn't today or yesterday, streak is 0
  if (dates[0] < currentRef - oneDayMs) return 0;

  for (let i = 0; i < dates.length; i++) {
    if (dates[i] === currentRef || dates[i] === currentRef - oneDayMs) {
      streak++;
      currentRef = dates[i];
    } else {
      break;
    }
  }
  return streak;
};
