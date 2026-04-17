const resourceCatalog = [
  {
    id: "striver_dsa",
    title: "Striver's A to Z DSA Course",
    platform: "YouTube",
    url: "https://www.youtube.com/watch?v=EAR7De6Gug4",
    description: "A structured DSA journey from basics to interview-level problem solving with strong topic sequencing.",
    covered_concepts: ["Arrays", "Linked List", "Trees", "Graphs", "Recursion"],
    tags: ["dsa", "arrays", "linked list", "trees", "graphs", "recursion", "algorithms"]
  },
  {
    id: "neetcode_roadmap",
    title: "NeetCode DSA Roadmap",
    platform: "NeetCode",
    url: "https://neetcode.io/roadmap",
    description: "A practical roadmap that helps learners move concept by concept with strong interview alignment.",
    covered_concepts: ["Arrays", "Sliding Window", "Binary Search", "Trees"],
    tags: ["dsa", "arrays", "binary search", "sliding window", "trees", "algorithms"]
  },
  {
    id: "abdul_bari_algo",
    title: "Abdul Bari Algorithms Playlist",
    platform: "YouTube",
    url: "https://www.youtube.com/watch?v=0IAPZzGSbME",
    description: "Deep theory and intuition for core algorithms, complexity, recursion, and graph thinking.",
    covered_concepts: ["Big O", "Sorting", "Searching", "Divide & Conquer"],
    tags: ["algorithms", "complexity", "big o", "sorting", "searching", "recursion"]
  },
  {
    id: "striver_dp",
    title: "Striver Dynamic Programming Series",
    platform: "YouTube",
    url: "https://www.youtube.com/watch?v=tyB0ztf0DNY",
    description: "A progressive DP series that builds from recursion and memoization into full DP patterns.",
    covered_concepts: ["Dynamic Programming", "Memoization", "Tabulation"],
    tags: ["dynamic programming", "dp", "memoization", "tabulation", "recursion"]
  },
  {
    id: "freecodecamp_dp",
    title: "Dynamic Programming Full Course",
    platform: "freeCodeCamp",
    url: "https://www.youtube.com/watch?v=oBt53YbR9Kk",
    description: "A beginner-friendly visual walkthrough of dynamic programming patterns and problem solving.",
    covered_concepts: ["Dynamic Programming", "Knapsack", "LCS"],
    tags: ["dynamic programming", "dp", "lcs", "knapsack"]
  },
  {
    id: "odin_js",
    title: "The Odin Project Full Stack JavaScript",
    platform: "The Odin Project",
    url: "https://www.theodinproject.com/paths/full-stack-javascript",
    description: "Project-based web development path covering JavaScript, React, Node.js, and real application building.",
    covered_concepts: ["JavaScript", "React", "Node.js", "Express"],
    tags: ["web", "javascript", "react", "node", "express", "frontend", "backend"]
  },
  {
    id: "react_docs",
    title: "React Official Learn Docs",
    platform: "React.dev",
    url: "https://react.dev/learn",
    description: "The official modern React learning path for components, state, effects, and architecture.",
    covered_concepts: ["React", "Hooks", "State Management"],
    tags: ["react", "hooks", "components", "state", "frontend"]
  },
  {
    id: "mdn_js",
    title: "MDN JavaScript Guide",
    platform: "MDN",
    url: "https://developer.mozilla.org/en-US/docs/Web/JavaScript/Guide",
    description: "Trusted reference and guided learning for core JavaScript language mechanics and browser APIs.",
    covered_concepts: ["JavaScript", "Objects", "Async JS", "ES6+"],
    tags: ["javascript", "async", "objects", "web", "frontend"]
  },
  {
    id: "andrew_ng_ml",
    title: "Machine Learning Specialization",
    platform: "Coursera",
    url: "https://www.coursera.org/specializations/machine-learning-introduction",
    description: "A foundational machine learning path with intuition, modeling basics, and practical supervised learning.",
    covered_concepts: ["Machine Learning", "Regression", "Neural Networks"],
    tags: ["machine learning", "ml", "ai", "regression", "classification", "neural networks"]
  },
  {
    id: "statquest_ml",
    title: "StatQuest Machine Learning Playlist",
    platform: "YouTube",
    url: "https://www.youtube.com/watch?v=Gv9_4yMHFhI",
    description: "Excellent visual explanations for ML concepts, probability, trees, and evaluation metrics.",
    covered_concepts: ["Decision Trees", "Probability", "Linear Regression"],
    tags: ["machine learning", "ml", "decision trees", "probability", "statistics"]
  },
  {
    id: "sqlbolt",
    title: "SQLBolt Interactive SQL",
    platform: "SQLBolt",
    url: "https://sqlbolt.com/",
    description: "An interactive SQL path that is ideal for building query fundamentals and confidence quickly.",
    covered_concepts: ["SELECT", "JOINs", "Aggregates"],
    tags: ["sql", "dbms", "database", "joins", "aggregates"]
  },
  {
    id: "khan_sql",
    title: "Khan Academy Intro to SQL",
    platform: "Khan Academy",
    url: "https://www.khanacademy.org/computing/computer-programming/sql",
    description: "A beginner-friendly SQL and relational database course with guided practice.",
    covered_concepts: ["SQL", "Schema Design", "Databases"],
    tags: ["sql", "database", "dbms", "schema"]
  },
  {
    id: "neso_os",
    title: "Neso Academy Operating Systems",
    platform: "YouTube",
    url: "https://www.youtube.com/watch?v=2i2llfPHe6M",
    description: "Clear operating systems explanations covering processes, deadlocks, memory, and scheduling.",
    covered_concepts: ["Operating Systems", "Processes", "Deadlocks", "Memory Management"],
    tags: ["os", "operating systems", "processes", "deadlocks", "memory"]
  },
  {
    id: "linux_journey",
    title: "Linux Journey",
    platform: "Linux Journey",
    url: "https://linuxjourney.com/",
    description: "A structured way to learn Linux fundamentals, shell basics, and file system workflows.",
    covered_concepts: ["Linux", "Shell", "Permissions"],
    tags: ["linux", "operating systems", "shell", "permissions"]
  }
];

const titleCase = (value = "") =>
  value
    .split(/[\s_-]+/)
    .filter(Boolean)
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");

const scoreResource = (resource, searchTerms) =>
  searchTerms.reduce((score, term) => {
    const haystack = `${resource.title} ${resource.description} ${resource.covered_concepts.join(" ")} ${resource.tags.join(" ")}`.toLowerCase();
    return haystack.includes(term) ? score + 2 : score;
  }, 0);

export const getResourceCategory = (resource = {}) => {
  const platform = String(resource.platform || "").toLowerCase();
  const url = String(resource.url || "").toLowerCase();

  if (platform.includes("coursera") || platform.includes("udemy") || platform.includes("edx")) {
    return "Certification";
  }

  if (url.includes("youtube.com") || url.includes("youtu.be") || platform.includes("youtube")) {
    return "YouTube Videos";
  }

  return "Documentation & Websites";
};

export const groupResourcesByCategory = (resources = []) => {
  const order = ["Certification", "Documentation & Websites", "YouTube Videos"];
  const grouped = order.map((category) => ({
    category,
    items: resources.filter((resource) => getResourceCategory(resource) === category)
  }));

  return grouped.filter((group) => group.items.length > 0);
};

export const getRecommendedResources = (topic, weakConcepts = [], limit = 4) => {
  const searchTerms = [
    String(topic || "").toLowerCase(),
    ...weakConcepts.map((concept) => String(concept || "").toLowerCase())
  ]
    .flatMap((term) => term.split(/[(),/]/))
    .map((term) => term.trim())
    .filter(Boolean);

  const ranked = resourceCatalog
    .map((resource) => ({ resource, score: scoreResource(resource, searchTerms) }))
    .filter(({ score }) => score > 0)
    .sort((a, b) => b.score - a.score)
    .map(({ resource }) => resource);

  const fallback = ranked.length > 0 ? ranked : resourceCatalog.filter((resource) => resource.tags.includes("dsa"));
  return fallback.slice(0, limit);
};

export const buildRoadmap = ({
  topic,
  weakConcepts = [],
  proficiencyLevel = "beginner",
  recommendedTimeBudgetMinutes = 30
}) => {
  const primaryWeakness = weakConcepts[0] || topic || "fundamentals";
  const secondaryWeakness = weakConcepts[1] || "problem solving";
  const foundationLabel = titleCase(primaryWeakness);
  const practiceLabel = titleCase(secondaryWeakness);
  const budget = Math.max(20, Number(recommendedTimeBudgetMinutes) || 30);

  return [
    {
      phase: "Foundation",
      title: `Rebuild ${foundationLabel}`,
      focus: `Close your core gap in ${primaryWeakness} with explanations and small examples before speed practice.`,
      action: `Spend ${Math.round(budget * 0.35)} minutes reviewing one concept and writing 2 short examples from memory.`,
      outcome: `You should be able to explain ${primaryWeakness} in your own words without looking at notes.`
    },
    {
      phase: "Guided Practice",
      title: `Practice ${practiceLabel} with structure`,
      focus: `Use medium-friction exercises that target the mistakes surfaced in your assessment.`,
      action: `Solve 2 focused problems around ${primaryWeakness} and ${secondaryWeakness}, then compare your approach to an ideal one.`,
      outcome: "You reduce repeat errors and begin recognizing the right pattern faster."
    },
    {
      phase: "Transfer",
      title: "Apply in mixed questions",
      focus: `Blend ${primaryWeakness} into broader ${topic || "subject"} problems so the concept transfers beyond isolated drills.`,
      action: "Attempt one mixed-difficulty problem or mini-project and note where your reasoning still slows down.",
      outcome: "You know whether the concept is truly retained or still needs another review cycle."
    }
  ];
};

export const normalizeStrategyPayload = (strategy, context) => {
  const recommendedCourses = strategy?.recommended_courses?.length
    ? strategy.recommended_courses
    : getRecommendedResources(context.topic, context.weakConcepts, 4);

  const sessionGoal = strategy?.session_goal || {
    primary_objective: titleCase(context.weakConcepts?.[0] || context.topic || "Core Fundamentals"),
    secondary_reinforcement: titleCase(context.weakConcepts?.[1] || "Problem Solving"),
    estimated_cognitive_load: "Medium",
    recommended_time_budget_minutes: 30
  };

  return {
    teaching_style: strategy?.teaching_style || "Visual Breakdown",
    pace: strategy?.pace || "Moderate",
    strategy_summary:
      strategy?.strategy_summary ||
      `A focused plan to strengthen ${context.weakConcepts?.[0] || context.topic} based on your latest assessment results.`,
    reasoning:
      strategy?.reasoning ||
      `This path prioritizes your weakest concepts first so your next practice session improves both accuracy and confidence.`,
    next_action: strategy?.next_action || "practice",
    daily_practice_tip:
      strategy?.daily_practice_tip ||
      `Spend 20-30 minutes daily on ${context.weakConcepts?.[0] || context.topic}, then finish with one mixed question.`,
    session_goal: sessionGoal,
    recommended_courses: recommendedCourses,
    grouped_resources: groupResourcesByCategory(recommendedCourses),
    roadmap:
      strategy?.roadmap?.length
        ? strategy.roadmap
        : buildRoadmap({
            topic: context.topic,
            weakConcepts: context.weakConcepts,
            proficiencyLevel: context.proficiencyLevel,
            recommendedTimeBudgetMinutes: sessionGoal.recommended_time_budget_minutes
          })
  };
};
