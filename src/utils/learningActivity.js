const getStorageKey = (userId) => `learning_activity_log_v1_${userId || 'guest'}`;

const loadActivityLog = (userId) => {
  try {
    const raw = localStorage.getItem(getStorageKey(userId));
    const parsed = raw ? JSON.parse(raw) : [];
    return Array.isArray(parsed) ? parsed : [];
  } catch (_) {
    return [];
  }
};

const saveActivityLog = (userId, activities) => {
  localStorage.setItem(getStorageKey(userId), JSON.stringify(activities.slice(0, 100)));
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

export const recordLearningActivity = (userId, activity) => {
  const nextActivity = {
    id: `${activity.type}_${Date.now()}`,
    timestamp: new Date().toISOString(),
    points: 0,
    ...activity,
  };

  const activities = [nextActivity, ...loadActivityLog(userId)];
  saveActivityLog(userId, activities);
  return nextActivity;
};

export const getLearningVelocityData = (userId) => {
  const activities = loadActivityLog(userId);
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

export const getRecentMilestones = (userId, limit = 3) => {
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

  return loadActivityLog(userId)
    .slice(0, limit)
    .map((activity) => ({
      title: activity.title,
      time: getRelativeTimeLabel(activity.timestamp),
      icon: iconByType[activity.type] || "✨",
      color: colorByType[activity.type] || "text-purple-400",
    }));
};

