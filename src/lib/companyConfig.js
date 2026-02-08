export const companyConfig = {
  tcs: {
    id: "tcs",
    name: "TCS National Qualifier Test",
    logo: "https://upload.wikimedia.org/wikipedia/commons/thumb/b/b1/Tata_Consultancy_Services_Logo.svg/512px-Tata_Consultancy_Services_Logo.svg.png",
    description: "Focuses heavily on Quantitative Aptitude and Coding standards.",
    timeLimit: 20 * 60, // 20 mins for mini-mock
    difficulty: "Moderate",
    color: "from-blue-600 to-indigo-600",
    domains: {
      quant: { label: "Quantitative Aptitude", weight: 0.35 }, // TCS loves Quant
      logical: { label: "Logical Reasoning", weight: 0.20 },
      verbal: { label: "Verbal Ability", weight: 0.15 },
      programming: { label: "Programming Logic", weight: 0.20 },
      cs: { label: "CS Fundamentals", weight: 0.10 }
    }
  },
  infosys: {
    id: "infosys",
    name: "Infosys Certification",
    logo: "https://upload.wikimedia.org/wikipedia/commons/9/95/Infosys_logo.svg",
    description: "Known for tricky Logical Reasoning and Critical Thinking puzzles.",
    timeLimit: 20 * 60,
    difficulty: "Hard",
    color: "from-blue-500 to-cyan-500",
    domains: {
      quant: { label: "Mathematical Ability", weight: 0.20 },
      logical: { label: "Logical Reasoning", weight: 0.35 }, // Infosys loves Logic
      verbal: { label: "Verbal Ability", weight: 0.25 },
      programming: { label: "Pseudocode", weight: 0.20 },
      cs: { label: "CS Basics", weight: 0.0 } // Infosys foundation often skips deep CS core in aptitude
    }
  },
  wipro: {
    id: "wipro",
    name: "Wipro NLTH",
    logo: "https://upload.wikimedia.org/wikipedia/commons/a/a0/Wipro_Primary_Logo_Color_RGB.svg",
    description: "Balanced assessment with a dedicated essay writing section (simulated).",
    timeLimit: 20 * 60,
    difficulty: "Moderate",
    color: "from-green-600 to-teal-600",
    domains: {
      quant: { label: "Quantitative", weight: 0.25 },
      logical: { label: "Logical", weight: 0.25 },
      verbal: { label: "Verbal", weight: 0.25 }, // Balanced
      programming: { label: "Automata Fix", weight: 0.25 },
      cs: { label: "CS Core", weight: 0.0 }
    }
  },
  accenture: {
    id: "accenture",
    name: "Accenture Cognitive",
    logo: "https://upload.wikimedia.org/wikipedia/commons/c/cd/Accenture.svg",
    description: "High speed test checking Cognitive and Technical capability equally.",
    timeLimit: 20 * 60,
    difficulty: "Easy-Moderate",
    color: "from-purple-600 to-fuchsia-600",
    domains: {
      quant: { label: "Analytical Reasoning", weight: 0.20 },
      logical: { label: "Logical Reasoning", weight: 0.20 },
      verbal: { label: "Verbal Ability", weight: 0.20 },
      programming: { label: "Technical MCQ", weight: 0.20 },
      cs: { label: "Cloud/Network Basics", weight: 0.20 } // Accenture tests tech breadth
    }
  },
  google: {
    id: "google",
    name: "Google Online Challenge",
    logo: "https://upload.wikimedia.org/wikipedia/commons/2/2f/Google_2015_logo.svg",
    description: "World-class algorithmic challenges focusing on Graphs, DP, and Trees.",
    timeLimit: 30 * 60, // 30 mins for heavier problems
    difficulty: "Expert",
    color: "from-red-500 to-orange-500",
    domains: {
      dsa_hard: { label: "Advanced Algorithms", weight: 0.50 }, // Heavy algo focus
      system_design: { label: "System Design Design", weight: 0.30 },
      cs: { label: "OS & Concurrency", weight: 0.20 },
      quant: { label: "Aptitude", weight: 0.0 },
      logical: { label: "Logic", weight: 0.0 }
    }
  },
  amazon: {
    id: "amazon",
    name: "Amazon OA",
    logo: "https://upload.wikimedia.org/wikipedia/commons/a/a9/Amazon_logo.svg",
    description: "Coding problems plus Leadership Principles assessment.",
    timeLimit: 25 * 60,
    difficulty: "Hard",
    color: "from-yellow-600 to-orange-600",
    domains: {
      dsa_hard: { label: "Data Structures", weight: 0.40 },
      verbal: { label: "Leadership Principles", weight: 0.30 }, // Simulated via verbal/situational
      cs: { label: "OS/Networks", weight: 0.10 },
      programming: { label: "Debugging", weight: 0.20 },
      quant: { label: "Aptitude", weight: 0.0 }
    }
  },
  microsoft: {
    id: "microsoft",
    name: "Microsoft Codility",
    logo: "https://upload.wikimedia.org/wikipedia/commons/4/44/Microsoft_logo.svg",
    description: "Balanced test of Algorithms, Low-Level Design, and Testing.",
    timeLimit: 25 * 60,
    difficulty: "Hard",
    color: "from-blue-500 to-cyan-500",
    domains: {
      dsa_hard: { label: "Algorithms", weight: 0.40 },
      programming: { label: "Code Quality/Testing", weight: 0.30 },
      cs: { label: "System Basics", weight: 0.30 },
      quant: { label: "Aptitude", weight: 0.0 },
      logical: { label: "Logic", weight: 0.0 }
    }
  },
  meta: {
    id: "meta",
    name: "Meta Careers",
    logo: "https://upload.wikimedia.org/wikipedia/commons/7/7b/Meta_Platforms_Inc._logo.svg",
    description: "Speed-focused coding questions. Solve fast, solve correct.",
    timeLimit: 20 * 60,
    difficulty: "Hard",
    color: "from-blue-600 to-indigo-600",
    domains: {
      dsa_hard: { label: "Rapid Coding", weight: 0.60 },
      system_design: { label: "Product Architecture", weight: 0.40 },
      cs: { label: "basics", weight: 0.0 },
      quant: { label: "aptitude", weight: 0.0 },
      logical: { label: "logic", weight: 0.0 }
    }
  }
};
