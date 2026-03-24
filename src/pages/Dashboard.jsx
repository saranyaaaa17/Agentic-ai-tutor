import { useAuth } from "../context/AuthContext";
import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useNavigate, useSearchParams } from "react-router-dom";
import MasteryRadar from "../components/MasteryRadar";
import { useSettings } from "../context/SettingsContext";
import { fetchMasteryFromSupabase, normalizeMasteryScore } from "../utils/syncUtils";
import { companyConfig } from "../lib/companyConfig";
import { getDailyChallengeCard } from "../utils/dailyChallenge";
import { getLearningVelocityData, getRecentMilestones } from "../utils/learningActivity";

/* ?????? Reusable SVG icon components ????????????????????????????????????????????????????????????????????????????????????????????? */
const Icon = {
  Grid: (p) => (
    <svg {...p} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/>
      <rect x="14" y="14" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/>
    </svg>
  ),
  Book: (p) => (
    <svg {...p} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"/>
    </svg>
  ),
  Code: (p) => (
    <svg {...p} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="16 18 22 12 16 6"/><polyline points="8 6 2 12 8 18"/>
    </svg>
  ),
  CheckList: (p) => (
    <svg {...p} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M9 11l3 3L22 4"/><path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11"/>
    </svg>
  ),
  CheckCircle: (p) => (
    <svg {...p} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/>
    </svg>
  ),
  BookOpen: (p) => (
    <svg {...p} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z"/><path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z"/>
    </svg>
  ),
  Flame: (p) => (
    <svg {...p} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M8.5 14.5A2.5 2.5 0 0 0 11 12c0-1.38-.5-2-1-3-1.072-2.143-.224-4.054 2-6 .5 2.5 2 4.9 4 6.5 2 1.6 3 3.5 3 5.5a7 7 0 1 1-14 0c0-1.153.433-2.294 1-3a2.5 2.5 0 0 0 2.5 3z"/>
    </svg>
  ),
  FileText: (p) => (
    <svg {...p} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
      <polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/><polyline points="10 9 9 9 8 9"/>
    </svg>
  ),
  Cpu: (p) => (
    <svg {...p} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="9" y="9" width="6" height="6"/><rect x="2" y="2" width="20" height="20" rx="2"/>
      <line x1="9" y1="2" x2="9" y2="6"/><line x1="15" y1="2" x2="15" y2="6"/>
      <line x1="9" y1="18" x2="9" y2="22"/><line x1="15" y1="18" x2="15" y2="22"/>
      <line x1="2" y1="9" x2="6" y2="9"/><line x1="2" y1="15" x2="6" y2="15"/>
      <line x1="18" y1="9" x2="22" y2="9"/><line x1="18" y1="15" x2="22" y2="15"/>
    </svg>
  ),
  Brain: (p) => (
    <svg {...p} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M9.5 2A2.5 2.5 0 0 1 12 4.5v15a2.5 2.5 0 0 1-4.96-.46 2.5 2.5 0 0 1-2.96-3.08 3 3 0 0 1-.34-5.58 2.5 2.5 0 0 1 1.32-4.24 2.5 2.5 0 0 1 1.98-3A2.5 2.5 0 0 1 9.5 2z"/>
      <path d="M14.5 2A2.5 2.5 0 0 0 12 4.5v15a2.5 2.5 0 0 0 4.96-.46 2.5 2.5 0 0 0 2.96-3.08 3 3 0 0 0 .34-5.58 2.5 2.5 0 0 0-1.32-4.24 2.5 2.5 0 0 0-1.98-3A2.5 2.5 0 0 0 14.5 2z"/>
    </svg>
  ),
  Globe: (p) => (
    <svg {...p} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10"/><line x1="2" y1="12" x2="22" y2="12"/>
      <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/>
    </svg>
  ),
  Database: (p) => (
    <svg {...p} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <ellipse cx="12" cy="5" rx="9" ry="3"/><path d="M21 12c0 1.66-4 3-9 3s-9-1.34-9-3"/>
      <path d="M3 5v14c0 1.66 4 3 9 3s9-1.34 9-3V5"/>
    </svg>
  ),
  Settings: (p) => (
    <svg {...p} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="3"/>
      <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/>
    </svg>
  ),
  BarChart: (p) => (
    <svg {...p} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <line x1="18" y1="20" x2="18" y2="10"/><line x1="12" y1="20" x2="12" y2="4"/>
      <line x1="6" y1="20" x2="6" y2="14"/><line x1="2" y1="20" x2="22" y2="20"/>
    </svg>
  ),
  Monitor: (p) => (
    <svg {...p} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="2" y="3" width="20" height="14" rx="2" ry="2"/>
      <line x1="8" y1="21" x2="16" y2="21"/><line x1="12" y1="17" x2="12" y2="21"/>
    </svg>
  ),
  Award: (p) => (
    <svg {...p} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="8" r="7"/><polyline points="8.21 13.89 7 23 12 20 17 23 15.79 13.88"/>
    </svg>
  ),
  Briefcase: (p) => (
    <svg {...p} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="2" y="7" width="20" height="14" rx="2" ry="2"/>
      <path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16"/>
    </svg>
  ),
  Zap: (p) => (
    <svg {...p} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/>
    </svg>
  ),
  Lightbulb: (p) => (
    <svg {...p} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <line x1="9" y1="18" x2="15" y2="18"/><line x1="10" y1="22" x2="14" y2="22"/>
      <path d="M15.09 14c.18-.98.65-1.74 1.41-2.5A4.65 4.65 0 0 0 18 8 6 6 0 0 0 6 8c0 1 .23 2.23 1.5 3.5A4.61 4.61 0 0 1 8.91 14"/>
    </svg>
  ),
  ChevronRight: (p) => (
    <svg {...p} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="9 18 15 12 9 6"/>
    </svg>
  ),
  ChevronDown: (p) => (
    <svg {...p} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="6 9 12 15 18 9"/>
    </svg>
  ),
  ArrowLeft: (p) => (
    <svg {...p} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <line x1="19" y1="12" x2="5" y2="12"/><polyline points="12 19 5 12 12 5"/>
    </svg>
  ),
  User: (p) => (
    <svg {...p} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/>
    </svg>
  ),
  LogOut: (p) => (
    <svg {...p} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/>
    </svg>
  ),
  Search: (p) => (
    <svg {...p} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
    </svg>
  ),
  Bell: (p) => (
    <svg {...p} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 0 1-3.46 0"/>
    </svg>
  ),
  Agent: (p) => (
    <svg {...p} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="11" width="18" height="10" rx="2"/><circle cx="12" cy="5" r="2"/><path d="M12 7v4"/><line x1="8" y1="16" x2="8" y2="16"/><line x1="16" y1="16" x2="16" y2="16"/>
    </svg>
  )
};

/* ?????? State & Constants ?????????????????????????????????????????????????????????????????????????????????????????????????????????????????????????????? */
const THEMES = {
  slate: { name: "Slate", class: "bg-slate-950" },
  glass: { name: "Glass", class: "bg-[#050811]/40" },
  dark: { name: "Dark", class: "bg-black" }
};

const formatMasteryPercent = (value) => `${Math.round(normalizeMasteryScore(value) * 100)}%`;
const masteryWidth = (value) => `${normalizeMasteryScore(value) * 100}%`;
const getVelocityCellClass = (value, maxValue) => {
  if (value <= 0 || maxValue <= 0) return "bg-slate-800 border-slate-700/60";

  const ratio = value / maxValue;
  if (ratio >= 0.85) return "bg-emerald-400 border-emerald-300/70 shadow-[0_0_18px_rgba(52,211,153,0.18)]";
  if (ratio >= 0.6) return "bg-emerald-500/80 border-emerald-400/60";
  if (ratio >= 0.3) return "bg-cyan-500/70 border-cyan-400/50";
  return "bg-blue-500/60 border-blue-400/40";
};

/* Mapping between company domains and mastery profile concepts */
const SKILL_DOMAIN_MAP = {
  quant: ["Logic", "Fundamentals"],
  logical: ["Logic"],
  verbal: ["Fundamentals"],
  programming: ["Syntax", "programming-problems"],
  cs: ["Systems", "Fundamentals", "os", "dbms"],
  dsa_hard: ["Algorithms", "dsa-problems"],
  system_design: ["Systems"]
};

const calculateCompanyFit = (companyId, masteryProfile) => {
  const cid = String(companyId).toLowerCase();
  const config = companyConfig[cid];
  if (!config || !masteryProfile) return 0;

  let weightedScore = 0;
  let totalWeight = 0;

  Object.entries(config.domains).forEach(([domain, domainConfig]) => {
    const weight = domainConfig.weight || 0;
    if (weight === 0) return;

    // Find the best match for this domain in the mastery profile
    const mappedSkills = SKILL_DOMAIN_MAP[domain] || [];
    let bestScore = 0;

    mappedSkills.forEach(skill => {
       const score = normalizeMasteryScore(masteryProfile[skill] || 0);
       if (score > bestScore) bestScore = score;
    });

    // If no direct mapped skill, maybe the skill *is* the domain name
    if (bestScore === 0 && masteryProfile[domain]) {
        bestScore = normalizeMasteryScore(masteryProfile[domain]);
    }

    weightedScore += (bestScore * weight);
    totalWeight += weight;
  });

  return totalWeight > 0 ? (weightedScore / totalWeight) * 100 : 0;
};


const Dashboard = () => {
  const searchRef = useRef(null);
  const { appearance: theme, accentColor } = useSettings();
  const { user, signOut } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const mode = searchParams.get("mode");
  const [selectedDomain, setSelectedDomain] = useState(null);
  const [activeTab, setActiveTab] = useState(mode || "progress");
  const [agentInsight, setAgentInsight] = useState(null);
  const [potd, setPotd] = useState({
    title: "Reverse Nodes in k-Group",
    difficulty: "Hard",
    points: 450,
    domain: "dsa",
    streak: 0,
    timeLeft: "24h 00m"
  });
  const [searchTerm, setSearchTerm] = useState("");
  const [isTraceMinimized, setIsTraceMinimized] = useState(true);
  const [learningVelocity, setLearningVelocity] = useState(() => getLearningVelocityData());
  const [recentMilestones, setRecentMilestones] = useState(() => getRecentMilestones());
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  const [agentStatus, setAgentStatus] = useState({
    coordinator: "connecting...",
    tutor: "connecting...",
    curator: "connecting...",
    evaluator: "connecting...",
    memory: "connecting..."
  });

  const [notification, setNotification] = useState(null);
  const [showNotifications, setShowNotifications] = useState(false);
  const [showSearchSuggestions, setShowSearchSuggestions] = useState(false);
  useEffect(() => {
    const handleSearchClickOutside = (e) => {
      if (searchRef.current && !searchRef.current.contains(e.target)) {
        setShowSearchSuggestions(false);
      }
    };
    const handleSearchEsc = (e) => {
      if (e.key === "Escape") setShowSearchSuggestions(false);
    };
    document.addEventListener("mousedown", handleSearchClickOutside);
    document.addEventListener("keydown", handleSearchEsc);
    return () => {
      document.removeEventListener("mousedown", handleSearchClickOutside);
      document.removeEventListener("keydown", handleSearchEsc);
    };
  }, []);

  const [feedMessages, setFeedMessages] = useState([
    "Welcome! Let's start learning.",
    "Your progress is saved.",
    "Ready for your next subject?"
  ]);

  useEffect(() => {
    setPotd(getDailyChallengeCard());
    setLearningVelocity(getLearningVelocityData());
    setRecentMilestones(getRecentMilestones());
  }, []);

  useEffect(() => {
    const refreshDashboardSignals = () => {
      setPotd(getDailyChallengeCard());
      setLearningVelocity(getLearningVelocityData());
      setRecentMilestones(getRecentMilestones());
    };
    window.addEventListener("focus", refreshDashboardSignals);
    return () => window.removeEventListener("focus", refreshDashboardSignals);
  }, []);

  useEffect(() => {
    const handleKeyDown = (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
        e.preventDefault();
        const searchInput = document.querySelector('input[placeholder*="Search"]');
        if (searchInput) searchInput.focus();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Readiness Logic (Option C: Confidence Score)
  const masteryValues = Object.values(agentInsight?.analysis?.mastery_profile || {}).map(normalizeMasteryScore);
  const readinessScore = masteryValues.length > 0 
    ? Math.round((masteryValues.reduce((a, b) => a + b, 0) / masteryValues.length) * 100) 
    : 0;
  const maxVelocityValue = Math.max(...learningVelocity.map((day) => day.value), 0);

  const companies = [
    { id: 'google', name: 'Google', min: 85, color: 'text-blue-400', bg: 'bg-blue-500/10' },
    { id: 'meta', name: 'Meta', min: 80, color: 'text-rose-400', bg: 'bg-rose-500/10' },
    { id: 'amazon', name: 'Amazon', min: 75, color: 'text-amber-400', bg: 'bg-amber-500/10' },
    { id: 'microsoft', name: 'Microsoft', min: 82, color: 'text-cyan-400', bg: 'bg-cyan-500/10' }
  ];

  const initial = (user?.user_metadata?.display_name || user?.email || "?").charAt(0).toUpperCase();
  const displayName = user?.user_metadata?.display_name || user?.email?.split("@")[0] || "Learner";

  const handleSignOut = async () => {
    try {
      await signOut();
      navigate("/");
    } catch (error) {
      console.error("Sign out error:", error.message);
      setNotification("Error signing out. Please try again.");
    }
  };

    const searchableData = [
    { label: "Data Structures", path: "/assessment?domain=dsa", category: "Learn" },
    { label: "Algorithms", path: "/assessment?domain=dsa", category: "Learn" },
    { label: "Machine Learning", path: "/assessment?domain=ml", category: "Learn" },
    { label: "Web Development", path: "/assessment?domain=web", category: "Learn" },
    { label: "DBMS", path: "/assessment?domain=dbms", category: "Learn" },
    { label: "Operating Systems", path: "/assessment?domain=os", category: "Learn" },
    { label: "Python Programming", path: "/assessment?domain=programming&subtopic=python", category: "Learn" },
    { label: "C++ Test / Challenges", path: "/problem-assessment?domain=programming-problems&subtopic=cpp-problems", category: "Practice" },
    { label: "Java Programming", path: "/assessment?domain=programming&subtopic=java", category: "Learn" },
    { label: "SQL Challenges", path: "/problem-assessment?domain=sql-problems", category: "Practice" },
    { label: "Logical Reasoning", path: "/problem-assessment?domain=logic-problems", category: "Practice" },
    { label: "Product-Based Companies", path: "/product-selection", category: "Exams" },
    { label: "Service-Based Companies", path: "/service-selection", category: "Exams" },
    { label: "Interview Prep", path: "/dashboard?mode=exam", category: "Exams" },
  ];

    const filteredSuggestions = searchTerm.trim() === "" 
    ? searchableData 
    : searchableData.filter(item => {
        const query = searchTerm.toLowerCase().replace(/[^a-z0-9]/g, "");
        const label = item.label.toLowerCase().replace(/[^a-z0-9]/g, "");
        return label.includes(query);
      });
    ;
    // initData removal (not defined)

    const pollStatus = async () => {
        try {
            const resp = await fetch("/api/status");
            const data = await resp.json();
            if (data.agents) setAgentStatus({ coordinator: "online", ...data.agents });
        } catch (_) {
            setAgentStatus(prev => ({ ...prev, coordinator: "offline" }));
        }
    };
   useEffect(() => { pollStatus();
    const statusInterval = setInterval(pollStatus, 15000);
    return () => clearInterval(statusInterval);
  }, [user]);

  const handleTabChange = (tabId) => {
    setActiveTab(tabId);
    setSearchTerm("");
    setSelectedDomain(null);
    setIsSidebarOpen(false); // Close sidebar on mobile after selection
    navigate(tabId === "progress" ? "/dashboard" : `/dashboard?mode=${tabId}`);
    window.scrollTo(0, 0);
  };

  const startVoiceSearch = () => {
    if (!window.webkitSpeechRecognition && !window.SpeechRecognition) {
      setNotification("Voice search not supported in this browser.");
      return;
    }
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    const recognition = new SpeechRecognition();
    recognition.lang = 'en-US';
    recognition.interimResults = false;
    recognition.maxAlternatives = 1;

    recognition.onstart = () => {
      setNotification("Voice Search: Listening for commands...");
    };

    recognition.onresult = (event) => {
      const transcript = event.results[0][0].transcript;
      setSearchTerm(transcript);
      setShowSearchSuggestions(true);
      setNotification(null);
    };

    recognition.onerror = () => {
      setNotification("Voice recognition failed. Try again.");
    };

    recognition.start();
  };

  const toggleTheme = () => {
    const next = theme === 'glass' ? 'dark' : 'glass';
    setTheme(next);
    localStorage.setItem('theme', next);
  };

  const updateAccent = (color) => {
    setAccentColor(color);
    localStorage.setItem('accent', color);
  };

  useEffect(() => {
    if (mode) setActiveTab(mode);
    else setActiveTab("progress");
    setSelectedDomain(null);
  }, [mode]);

  const conceptDomains = [
    {
      id: "dsa", title: "Data Structures & Algorithms",
      description: "Arrays, Trees, Graphs, DP and more.",
      color: "blue",
      subDomains: [
        { id: "arrays", title: "Arrays", difficulty: "Easy" },
        { id: "strings", title: "Strings", difficulty: "Easy" },
        { id: "linked-list", title: "Linked List", difficulty: "Medium" },
        { id: "stacks-queues", title: "Stacks & Queues", difficulty: "Medium" },
        { id: "trees", title: "Trees", difficulty: "Medium" },
        { id: "graphs", title: "Graphs", difficulty: "Hard" },
        { id: "dp", title: "Dynamic Programming", difficulty: "Hard" }
      ]
    },
    {
      id: "programming", title: "Programming Languages",
      description: "C, C++, Java, Python, JavaScript and more.",
      color: "green",
      subDomains: [
        { id: "c", title: "C Programming", difficulty: "Easy" },
        { id: "cpp", title: "C++", difficulty: "Medium" },
        { id: "java", title: "Java", difficulty: "Medium" },
        { id: "python", title: "Python", difficulty: "Easy" },
        { id: "javascript", title: "JavaScript", difficulty: "Medium" },
      ]
    },
    { id: "ml", title: "Machine Learning", description: "AI, Deep Learning, and Neural Networks.", color: "purple", subDomains: [] },
    { id: "web", title: "Web Development", description: "HTML, CSS, React, and Frontend Logic.", color: "orange", subDomains: [] },
    { id: "dbms", title: "Database Management", description: "SQL, NoSQL, and Database Design.", color: "cyan", subDomains: [] },
    { id: "os", title: "Operating Systems", description: "Processes, Memory, and Concurrency.", color: "rose", subDomains: [] },
  ];

  const problemDomains = [
    {
      id: "programming-problems", title: "Programming",
      description: "Practice across difficulty levels.",
      color: "green",
      subDomains: [
        { id: "c-problems", title: "C Programming", difficulty: "Easy" },
        { id: "cpp-problems", title: "C++ Challenges", difficulty: "Medium" },
        { id: "python-problems", title: "Python Logic", difficulty: "Easy" },
      ]
    },
    {
      id: "dsa-problems", title: "Data Structures",
      description: "Arrays, Trees, Graphs and more.",
      color: "blue",
      subDomains: [
        { id: "arrays-hashing", title: "Arrays & Hashing", difficulty: "Easy" },
        { id: "trees-graphs", title: "Trees & Graphs", difficulty: "Hard" },
      ]
    },
    { id: "sql-problems", title: "SQL Challenges", description: "Queries, joins and optimizations.", color: "cyan", subDomains: [] },
    { id: "logic-problems", title: "Logical Reasoning", description: "Puzzles and analytical thinking.", color: "purple", subDomains: [] },
  ];

  const examDomains = [
    { id: "product-based", title: "Product-Based Companies", description: "Prepare for FAANG, Google, Microsoft, Amazon.", badge: "High Difficulty" },
    { id: "service-based", title: "Service-Based Companies", description: "Prepare for TCS, Infosys, Wipro, Accenture.", badge: "Moderate Difficulty" },
  ];

  const handleSelection = (domainId) => {
    if (activeTab === 'exam') {
      navigate(domainId === 'product-based' ? '/product-selection' : '/service-selection');
      return;
    }
    const domains = activeTab === 'concept' ? conceptDomains : problemDomains;
    const domain = domains.find(d => d.id === domainId);
    if (domain?.subDomains?.length > 0) setSelectedDomain(domainId);
    else navigate(`${activeTab === 'concept' ? '/assessment' : '/problem-assessment'}?domain=${domainId}`);
  };

  const navItems = [
    { id: "concept",   label: "Learn",           icon: <Icon.Book className="w-4 h-4" /> },
    { id: "problem",   label: "Practice",        icon: <Icon.Code className="w-4 h-4" /> },
    { id: "exam",      label: "Interview Prep",  icon: <Icon.CheckList className="w-4 h-4" /> },
    { id: "progress",  label: "Progress",        icon: <Icon.BarChart className="w-4 h-4" /> },
  ];

  const colorMap = {
    blue:  { accent: "text-blue-400",   bg: "bg-blue-500/15",   border: "border-blue-500/25",   hover: "hover:border-blue-500/50",   icon: "text-blue-400",   bar: "bg-blue-500"   },
    cyan:  { accent: "text-cyan-400",   bg: "bg-cyan-500/15",   border: "border-cyan-500/25",   hover: "hover:border-cyan-500/50",   icon: "text-cyan-400",   bar: "bg-cyan-500"   },
    rose:  { accent: "text-rose-400",   bg: "bg-rose-500/15",   border: "border-rose-500/25",   hover: "hover:border-rose-500/50",   icon: "text-rose-400",   bar: "bg-rose-500"   },
    amber: { accent: "text-amber-400", bg: "bg-amber-500/15", border: "border-amber-500/25", hover: "hover:border-amber-500/50", icon: "text-amber-400", bar: "bg-amber-500" },
    green:  { accent: "text-green-400",  bg: "bg-green-500/15",  border: "border-green-500/25",  hover: "hover:border-green-500/50",  icon: "text-green-400",  bar: "bg-green-500"  },
    purple: { accent: "text-purple-400", bg: "bg-purple-500/15", border: "border-purple-500/25", hover: "hover:border-purple-500/50", icon: "text-purple-400", bar: "bg-purple-500" },
    orange: { accent: "text-orange-400", bg: "bg-orange-500/15", border: "border-orange-500/25", hover: "hover:border-orange-500/50", icon: "text-orange-400", bar: "bg-orange-500" },
  };

  const currentTheme = colorMap[accentColor] || colorMap.blue;

  return (
    <div className={`h-screen text-slate-200 flex font-sans overflow-hidden transition-all duration-700
      ${theme === 'glass' ? 'bg-[#050811]' : 'bg-slate-950'}`}>
      
      {/* Mobile Sidebar Overlay */}
      <AnimatePresence>
        {isSidebarOpen && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setIsSidebarOpen(false)}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-55 lg:hidden"
          />
        )}
      </AnimatePresence>

      {/* Dynamic Background Effects */}
      {theme === 'glass' && (
         <div className="fixed inset-0 pointer-events-none overflow-hidden">
            <div className={`absolute -top-20 -left-20 w-[600px] h-[600px] rounded-full blur-[160px] opacity-15 ${currentTheme.bar}`} />
            <div className={`absolute -bottom-20 -right-20 w-[600px] h-[600px] rounded-full blur-[160px] opacity-15 ${currentTheme.bar}`} />
            <div className="absolute inset-0 bg-[url('/grid.svg')] bg-center mask-[linear-gradient(180deg,white,rgba(255,255,255,0))] opacity-40" />
         </div>
      )}

      {/* Sidebar */}
      <aside className={`fixed lg:relative h-screen flex flex-col z-60 shrink-0 transition-all duration-500
        ${isSidebarOpen ? 'translate-x-0 w-72' : '-translate-x-full lg:translate-x-0 w-64 lg:block'}
        ${theme === 'glass' ? 'bg-slate-950/90 lg:bg-slate-950/40 backdrop-blur-3xl border-r border-white/5' : 'bg-slate-950 border-r border-slate-900'}`}>
         
         <div className="p-8 pb-10">
            <div className="flex items-center gap-3 group px-2 cursor-pointer" onClick={() => navigate('/dashboard')}>
               <div className="w-8 h-8 rounded-lg bg-blue-600 flex items-center justify-center shadow-lg shadow-blue-600/20 group-hover:scale-110 transition-all">
                  <Icon.Agent className="w-5 h-5 text-white" />
               </div>
               <span className="text-[13px] font-black text-white tracking-widest uppercase">Agentic Tutor</span>
            </div>
         </div>

         <nav className="flex-1 px-4 space-y-1 overflow-y-auto custom-scrollbar">
            <div className="px-4 text-[10px] font-bold text-slate-600 uppercase tracking-widest mb-4">Core Pathways</div>
            {navItems.map((item) => (
               <button
                  key={item.id}
                  onClick={() => handleTabChange(item.id)}
                  className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all group
                    ${activeTab === item.id 
                      ? 'bg-white/10 text-white shadow-sm' 
                      : 'text-slate-500 hover:text-slate-200 hover:bg-white/5'}`}
               >
                  <div className={`${activeTab === item.id ? currentTheme.accent : 'group-hover:text-slate-300'} transition-colors`}>
                     {item.icon}
                  </div>
                  <span className="text-sm font-bold">{item.label}</span>
                  {activeTab === item.id && (
                     <motion.div layoutId="nav-pill" className={`ml-auto w-1 h-4 rounded-full ${currentTheme.bar}`} />
                  )}
               </button>
            ))}
            
            <div className="pt-8 space-y-1">
               <div className="px-4 mb-2 text-[10px] font-bold text-slate-600 uppercase">Secondary</div>
               <button onClick={() => { setIsSidebarOpen(false); navigate("/settings"); }} className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-slate-500 hover:text-white hover:bg-white/5">
                  <Icon.Settings className="w-4 h-4" />
                  <span className="text-sm font-bold">Settings</span>
               </button>
            </div>
         </nav>

         <div className="p-6 border-t border-white/5 space-y-4">
           <button 
             onClick={() => { setIsSidebarOpen(false); navigate('/profile'); }} 
             className="w-full group/profile flex items-center gap-3 p-3 rounded-2xl hover:bg-white/5 transition-all text-left"
           >
              <div className="w-9 h-9 rounded-full bg-slate-800 border border-white/10 flex items-center justify-center text-sm font-black text-blue-400 group-hover/profile:border-blue-500/50 transition-all">
                 {initial}
              </div>
              <div className="flex-1 min-w-0">
                 <div className="text-sm font-bold text-white truncate">{displayName}</div>
                 <div className="text-[10px] text-slate-500 truncate group-hover/profile:text-blue-400 transition-colors uppercase font-black">Student Learner</div>
              </div>
           </button>
           <button onClick={handleSignOut} className="w-full flex items-center gap-3 px-4 py-2.5 rounded-xl text-slate-500 hover:text-rose-400 hover:bg-rose-400/5 transition-all text-[10px] font-black uppercase tracking-widest">
             <Icon.LogOut className="w-4 h-4" /> Sign Out
           </button>
         </div>
      </aside>

      {/* Main */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        <header className="h-16 border-b border-white/5 flex items-center justify-between px-4 md:px-8 bg-slate-950/40 backdrop-blur-xl shrink-0 z-40">
           <div className="flex items-center gap-3 text-xs font-bold uppercase tracking-widest flex-1">
              <button 
                onClick={() => setIsSidebarOpen(true)}
                className="lg:hidden p-2 text-slate-400 hover:text-white transition-colors"
                title="Open Menu"
              >
                <Icon.Grid className="w-6 h-6" />
              </button>
              <span className="text-slate-500 hidden md:inline">Platform</span>
              <span className="text-slate-300 hidden md:inline">/</span>
              <span className="text-blue-400 truncate">{navItems.find(n => n.id === activeTab)?.label}</span>
           </div>

           {/* Search Bar */}
           <div ref={searchRef} className="flex-2 max-w-md mx-2 md:mx-4 relative group">
                <div className="absolute inset-y-0 left-3 flex items-center pointer-events-none">
                   <Icon.Search className="w-4 h-4 text-slate-500 group-focus-within:text-blue-400 transition-colors" />
                </div>
                 <input 
                   type="text"
                   placeholder="Search... (Ctrl+K)"
                   value={searchTerm}
                   onChange={(e) => setSearchTerm(e.target.value)}
                   onFocus={() => setShowSearchSuggestions(true)}
                   className="w-full bg-slate-950/40 border border-white/5 rounded-xl py-2 pl-10 pr-10 md:pr-16 text-sm focus:outline-none focus:border-white/20 transition-all placeholder-slate-600"
                 />
                 <div className="absolute inset-y-0 right-3 flex items-center gap-1 md:gap-2">
                    <button 
                      onClick={startVoiceSearch}
                      className="text-slate-600 hover:text-blue-400 transition-colors"
                      title="Voice Search"
                    >
                       <Icon.Zap className="w-4 h-4" />
                    </button>
                    <div className="hidden md:block px-1.5 py-0.5 rounded border border-white/10 bg-white/5 text-[10px] font-mono text-slate-500">K</div>
                 </div>
                
                {showSearchSuggestions && searchTerm.length > 0 && (
                   <div className="absolute top-full left-0 right-0 mt-2 bg-slate-900 border border-slate-800 rounded-xl shadow-2xl overflow-hidden z-100">
                      {filteredSuggestions.length > 0 ? (
                        filteredSuggestions.map((s, i) => (
                           <button 
                             key={i} 
                             onClick={() => {
                               navigate(s.path);
                               setShowSearchSuggestions(false);
                             }}
                             className="w-full text-left px-4 py-3 hover:bg-white/5 flex items-center justify-between border-b border-slate-800 last:border-0"
                           >
                              <div className="flex flex-col">
                                 <span className="text-sm font-bold text-white">{s.label}</span>
                                 <span className="text-[10px] text-slate-500 uppercase font-black">{s.category}</span>
                              </div>
                              <Icon.ChevronRight className="w-3 h-3 text-slate-600" />
                           </button>
                        ))
                      ) : (
                        <div className="px-4 py-3 text-xs text-slate-500">No results found</div>
                      )}
                   </div>
                )}
           </div>

           <div className="flex-1 flex justify-end items-center gap-4">
              <button 
                onClick={() => setNotification("You have 3 new adaptive challenges waiting.")} 
                className="p-2 rounded-lg bg-slate-800/50 text-slate-400 hover:text-white transition-colors relative"
              >
                 <Icon.Bell className="w-5 h-5" />
                 <div className="absolute top-2 right-2 w-2 h-2 bg-blue-500 rounded-full border-2 border-slate-900" />
              </button>
           </div>
        </header>

        <main className="flex-1 overflow-y-auto p-8 relative">
          <AnimatePresence mode="wait">
            <motion.div key={activeTab} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} transition={{ duration: 0.2 }}>
              
               {activeTab === 'progress' && (
                <div className="space-y-8 max-w-6xl mx-auto pb-20">
                   <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
                      <div>
                         <h1 className="text-4xl font-black text-white mb-2 tracking-tight">Welcome, {displayName}!</h1>
                         <p className="text-slate-400 font-medium">Your personalized learning platform starts here.</p>
                      </div>
                   </div>

                   <div className="grid grid-cols-1 xl:grid-cols-12 gap-8 items-start">
                       <div className="xl:col-span-7 space-y-8">
                           {/* Skill Mastery Overiew - Redesigned for Beginner Clarity */}
                           <div className="bg-slate-900/50 border border-slate-800 rounded-2xl p-8 backdrop-blur-md relative overflow-hidden group">
                              <div className="flex items-center justify-between mb-8">
                                 <h3 className="text-lg font-bold text-white flex items-center gap-3">
                                    <div className="w-10 h-10 rounded-xl bg-blue-500/10 flex items-center justify-center border border-blue-500/20 shadow-lg shadow-blue-500/5">
                                       <Icon.BarChart className="w-5 h-5 text-blue-400" />
                                    </div>
                                    Skill Mastery Status
                                 </h3>
                                 <div className="px-4 py-1.5 rounded-full bg-white/5 border border-white/10 text-[10px] font-black text-slate-400 uppercase tracking-widest">
                                    ACTIVE
                                </div>
                              </div>
                                <div className="grid grid-cols-1 lg:grid-cols-[minmax(0,1.05fr)_minmax(300px,0.95fr)] gap-8 mb-8">
                                  {/* Left: Logic Grid with Terminal Bars */}
                                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-1 gap-4">
                                     {Object.entries(agentInsight?.analysis?.mastery_profile || {}).map(([skill, value], i) => (
                                        <div key={i} className="group/skill">
                                           <div className="flex items-center justify-between mb-2">
                                              <span className="text-xs font-black text-white uppercase tracking-wider">{skill}</span>
                                              <div className="flex items-center gap-2">
                                                 <span className={`text-[10px] font-black ${normalizeMasteryScore(value) < 0.4 ? 'text-amber-500' : 'text-blue-400'}`}>
                                                    {formatMasteryPercent(value)}
                                                 </span>
                                                 
                                              </div>
                                           </div>
                                           
                                           <div className="w-full h-1 bg-slate-800 rounded-full overflow-hidden">
                                              <motion.div 
                                                 initial={{ width: 0 }}
                                                 animate={{ width: masteryWidth(value) }}
                                                 className={`h-full rounded-full ${normalizeMasteryScore(value) < 0.4 ? 'bg-amber-500' : 'bg-blue-500'}`}
                                              />
                                           </div>
                                        </div>
                                     ))}
                                  </div>

                                  {/* Right: Radar Chart for Multi-dimensional view */}
                                  <div className="bg-slate-950/30 rounded-3xl border border-white/5 p-4 flex items-center justify-center relative overflow-hidden">
                                     <div className="absolute inset-0 bg-blue-500/5 blur-3xl rounded-full translate-y-1/2" />
                                     <div className="relative z-10 w-full aspect-square flex items-center justify-center">
                                        <MasteryRadar masteryProfile={agentInsight?.analysis?.mastery_profile || {}} />
                                     </div>
                                  </div>
                               </div>

                              <div className="bg-blue-500/5 border border-blue-500/10 p-5 rounded-2xl flex items-center gap-5">
                                 <div className="w-12 h-12 rounded-full bg-blue-500/10 flex items-center justify-center shrink-0">
                                    <Icon.Zap className="w-6 h-6 text-blue-400" />
                                 </div>
                                 <div>
                                    <div className="text-[10px] font-black text-blue-500 uppercase tracking-widest mb-1">Agent Strategy</div>
                                    <div className="text-xs text-slate-400 leading-relaxed font-medium">
                                       I've detected your baseline is strong in <span className="text-white">Logic</span>. Focusing on <span className="text-blue-400">Syntax mastery</span> will yield the fastest growth this week.
                                    </div>
                                 </div>
                              </div>
                           </div>

                           <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                              {/* Quick Guide for New Users */}
                              <div className="bg-linear-to-br from-blue-600/20 to-indigo-600/20 border border-blue-500/30 rounded-2xl p-6 relative overflow-hidden h-full min-h-[320px]">
                                 <div className="absolute top-[-20%] right-[-10%] w-32 h-32 bg-blue-500/20 blur-3xl rounded-full" />
                                 <h3 className="text-sm font-black text-blue-400 uppercase tracking-widest mb-6">Getting Started</h3>
                                 <div className="space-y-6">
                                    {[
                                      { step: 1, title: "Pick a Topic", desc: "Explore subjects in the 'Learn' section.", icon: "1️⃣" },
                                      { step: 2, title: "Assess Skills", desc: "Take a short quiz to find your level.", icon: "2️⃣" },
                                      { step: 3, title: "Master Gaps", desc: "Practice exactly what you find difficult.", icon: "3️⃣" }
                                    ].map(item => (
                                      <div key={item.step} className="flex gap-4">
                                        <div className="text-xl shrink-0">{item.icon}</div>
                                        <div>
                                          <div className="text-sm font-bold text-white">{item.title}</div>
                                          <div className="text-xs text-slate-400 leading-relaxed">{item.desc}</div>
                                        </div>
                                      </div>
                                    ))}
                                 </div>
                              </div>

                              {/* Current Focus Card */}
                              <div className="bg-slate-900/50 border border-slate-800 rounded-2xl p-6 h-full min-h-[320px] flex flex-col justify-between">
                                 <div>
                                    <h3 className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-4">Recommended Focus</h3>
                                    <div className="flex items-center gap-4 mb-4">
                                       <div className="w-12 h-12 rounded-2xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center">
                                          <Icon.Zap className="w-6 h-6 text-amber-500" />
                                       </div>
                                       <div>
                                          <div className="text-xl font-bold text-white">{agentInsight?.analysis?.recommended_focus}</div>
                                          <div className="text-[10px] text-slate-500 font-bold uppercase tracking-widest">Baseline Path</div>
                                       </div>
                                    </div>
                                 </div>
                                 <button 
                                   onClick={() => handleTabChange('concept')}
                                   className="w-full py-3.5 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl text-xs font-bold text-white uppercase tracking-widest transition-all"
                                 >
                                   Initialize Path
                                 </button>
                              </div>
                           </div>
                       </div>

                       <div className="space-y-6 xl:col-span-5 xl:sticky xl:top-24">
                          {/* Option C: Interview Readiness Command Center */}
                          <div className="bg-slate-950/60 border border-white/10 rounded-2xl p-8 relative group overflow-hidden shadow-2xl shadow-blue-500/5">
                             <div className="absolute inset-0 bg-linear-to-br from-blue-600/5 via-transparent to-purple-600/5" />
                             <div className="relative z-10">
                                <div className="flex items-center justify-between mb-8">
                                   <div className="flex items-center gap-2">
                                      <div className="w-2 h-2 rounded-full bg-blue-500 shadow-[0_0_10px_rgba(59,130,246,0.8)] animate-pulse" />
                                      <span className="text-[10px] font-black uppercase text-slate-400 tracking-[0.2em]">Readiness Prediction</span>
                                   </div>
                                   <Icon.Award className="w-4 h-4 text-blue-400" />
                                </div>

                                <div className="flex items-center justify-center py-4 relative mb-8">
                                   <div className="absolute inset-0 flex items-center justify-center">
                                      <div className="w-32 h-32 rounded-full border-4 border-white/5 border-t-blue-500 animate-[spin_3s_linear_infinite]" />
                                   </div>
                                   <div className="text-center group-hover:scale-110 transition-transform duration-500">
                                      <div className="text-5xl font-black text-white mb-1 tabular-nums">{readinessScore}%</div>
                                      <div className="text-[10px] font-black text-blue-500 uppercase tracking-widest">Confidence</div>
                                   </div>
                                </div>

                                <div className="space-y-4">
                                   <div className="text-[9px] font-black text-slate-500 uppercase tracking-widest px-1">Company Fit Comparison</div>
                                   <div className="grid grid-cols-2 gap-2">
                                       {companies.map(c => {
                                          const fitScore = calculateCompanyFit(c.id, agentInsight?.analysis?.mastery_profile);
                                          const isReady = fitScore >= c.min;
                                          return (
                                            <div key={c.name} className={`${c.bg} border border-white/5 rounded-2xl p-3 flex items-center justify-between group/comp`}>
                                               <div className="flex flex-col">
                                                  <span className={`text-[10px] font-bold ${c.color}`}>{c.name}</span>
                                                  <span className="text-[8px] text-slate-500 font-black">{Math.round(fitScore)}% Fit</span>
                                               </div>
                                               <div className="flex items-center gap-1.5">
                                                  <div className={`w-1.5 h-1.5 rounded-full ${isReady ? "bg-green-500 shadow-[0_0_5px_#22c55e]" : "bg-slate-700"}`} />
                                                  <span className="text-[9px] font-black text-white/40">{c.min}%</span>
                                               </div>
                                            </div>
                                          );
                                       })}
                                   </div>
                                   <div className="mt-6 p-4 rounded-2xl bg-white/5 border border-white/10 group-hover:bg-blue-500/10 transition-colors">
                                      <div className="flex items-center gap-2 mb-2">
                                         <Icon.Brain className="w-4 h-4 text-blue-400" />
                                         <span className="text-[10px] font-bold text-white uppercase tracking-tight">AI Readiness Insight</span>
                                      </div>
                                      <p className="text-[11px] text-slate-400 leading-relaxed font-medium">
                                         {readinessScore > 80 
                                            ? "You're in the elite bracket. Focus on behavioral 'STAR' answers to finalize Meta/Google prep." 
                                            : "Broaden your High-Level System Design knowledge. This is your primary blocker for L5 roles."}
                                      </p>
                                   </div>
                                </div>
                             </div>
                          </div>

                          {/* Today's Challenge (POTD) - Feature 1 */}
                         <div className="bg-slate-950/40 border border-white/5 rounded-2xl p-7 relative group overflow-hidden transition-all hover:border-white/10 hover:shadow-2xl hover:shadow-blue-500/5">
                            <div className="flex items-center justify-between mb-8">
                               <div className="flex items-center gap-2">
                                  <div className="w-1.5 h-1.5 rounded-full bg-blue-500 shadow-[0_0_8px_rgba(59,130,246,0.5)] animate-pulse" />
                                  <span className="text-[10px] font-black uppercase text-slate-400 tracking-widest">Today's Challenge</span>
                               </div>
                               <div className="flex items-center gap-1.5 text-[9px] font-bold text-slate-500 bg-white/5 px-2 py-0.5 rounded-full border border-white/5">
                                  <Icon.Zap className="w-3 h-3 text-amber-500" />
                                  STREAK: {potd.streak}
                               </div>
                            </div>
                            
                            <h4 className="text-2xl font-black text-white mb-3 tracking-tight group-hover:text-blue-400 transition-colors">
                               {potd.title}
                            </h4>
                            <div className="flex items-center gap-4 mb-8">
                               <span className={`text-[10px] font-black px-2.5 py-1 rounded-[10px] border ${potd.difficulty === 'Hard' ? 'border-rose-500/40 text-rose-400 bg-rose-500/5' : 'border-amber-500/40 text-amber-400 bg-amber-500/5'}`}>
                                  {potd.difficulty}
                                </span>
                               <span className="text-[10px] font-black text-slate-600 uppercase tracking-widest">{potd.points} XP • {potd.domain.toUpperCase()}</span>
                            </div>

                             <div className="flex items-center justify-between gap-4">
                               <button 
                                 onClick={() => navigate("/daily-challenge")}
                                 className="flex-1 py-3.5 px-6 rounded-2xl text-[11px] font-black uppercase tracking-widest bg-white text-black hover:bg-slate-200 transition-all shadow-xl active:scale-[0.98]"
                               >
                                  SOLVE CHALLENGE
                               </button>
                               <div className="text-right">
                                  <div className="text-[8px] font-bold text-slate-600 uppercase mb-0.5">Expires</div>
                                  <div className="text-[10px] font-black text-slate-400 font-mono tracking-tighter">{potd.timeLeft}</div>
                               </div>
                            </div>
                         </div>
                       </div>
                    </div>

                    {/* NEW: Learning Velocity & Activity Feed */}
                    <div className="grid grid-cols-1 xl:grid-cols-12 gap-8 mt-8">
                       <div className="xl:col-span-8 bg-slate-900/50 border border-slate-800 rounded-2xl p-8 backdrop-blur-md">
                          <h3 className="text-lg font-bold text-white flex items-center gap-3 mb-6">
                             <div className="w-10 h-10 rounded-xl bg-purple-500/10 flex items-center justify-center border border-purple-500/20 shadow-lg shadow-purple-500/5">
                                <Icon.BarChart className="w-5 h-5 text-purple-400" />
                             </div>
                             Learning Velocity (Last 7 Days)
                          </h3>
                          <div className="mt-8 rounded-2xl border border-white/5 bg-black/10 p-5">
                             <div className="flex items-center justify-between gap-4 mb-5">
                                <div className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-500">
                                   Consistency Heatmap
                                </div>
                                <div className="flex items-center gap-2 text-[10px] font-bold text-slate-500">
                                   <span>Less</span>
                                   {[0, 1, 2, 3, 4].map((level) => (
                                      <div
                                        key={level}
                                        className={`w-3 h-3 rounded-[4px] border ${
                                          level === 0
                                            ? "bg-slate-800 border-slate-700/60"
                                            : level === 1
                                            ? "bg-blue-500/60 border-blue-400/40"
                                            : level === 2
                                            ? "bg-cyan-500/70 border-cyan-400/50"
                                            : level === 3
                                            ? "bg-emerald-500/80 border-emerald-400/60"
                                            : "bg-emerald-400 border-emerald-300/70"
                                        }`}
                                      />
                                   ))}
                                   <span>More</span>
                                </div>
                             </div>

                             <div className="grid grid-cols-[56px_minmax(0,1fr)] gap-4 items-start">
                                <div className="grid grid-rows-1 gap-2 pt-1">
                                   <div className="h-7 text-[9px] font-black uppercase tracking-[0.2em] text-slate-600 flex items-center">
                                      Week
                                   </div>
                                </div>

                                <div className="space-y-3">
                                   <div className="grid grid-cols-7 gap-2">
                                      {learningVelocity.map((day) => (
                                        <div
                                          key={`${day.key}_label`}
                                          className="text-center text-[9px] font-black uppercase tracking-[0.2em] text-slate-600"
                                        >
                                          {day.label}
                                        </div>
                                      ))}
                                   </div>

                                   <div className="grid grid-cols-7 gap-2">
                                      {learningVelocity.map((day) => (
                                        <div key={day.key} className="group/heat flex flex-col items-center gap-2">
                                           <motion.div
                                             initial={{ opacity: 0, scale: 0.9 }}
                                             animate={{ opacity: 1, scale: 1 }}
                                             transition={{ type: "spring", stiffness: 260, damping: 18 }}
                                             className={`w-full aspect-square rounded-[10px] border transition-all duration-300 group-hover/heat:scale-105 ${getVelocityCellClass(day.value, maxVelocityValue)}`}
                                             title={`${day.label}: ${day.value} XP`}
                                           />
                                           <div className="text-[9px] font-bold text-slate-500 opacity-0 group-hover/heat:opacity-100 transition-opacity">
                                              {day.value > 0 ? `${day.value} XP` : "No activity"}
                                           </div>
                                        </div>
                                      ))}
                                   </div>
                                </div>
                             </div>
                          </div>
                       </div>

                       <div className="xl:col-span-4 bg-slate-900/50 border border-slate-800 rounded-2xl p-8 backdrop-blur-md h-full">
                          <h3 className="text-sm font-black text-slate-500 uppercase tracking-widest mb-6">Recent Milestones</h3>
                          <div className="space-y-6 relative before:absolute before:inset-y-0 before:left-[11px] before:w-px before:bg-slate-800">
                             {(recentMilestones.length > 0 ? recentMilestones : []).map((evt, i) => (
                                <div key={i} className="flex gap-4 relative">
                                   <div className="w-6 h-6 rounded-full bg-slate-900 border border-slate-700 flex items-center justify-center text-[10px] shrink-0 z-10">
                                      {evt.icon}
                                   </div>
                                   <div>
                                      <div className={`text-xs font-bold ${evt.color}`}>{evt.title}</div>
                                      <div className="text-[9px] font-black text-slate-600 uppercase tracking-widest mt-1">{evt.time}</div>
                                   </div>
                                </div>
                             ))}
                             {recentMilestones.length === 0 && (
                                <div className="text-xs text-slate-500">Complete an assessment or solve today&apos;s challenge to populate this feed.</div>
                             )}
                          </div>
                          <button className="w-full mt-8 py-3 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl text-[10px] font-bold text-white uppercase tracking-widest transition-all">
                             View Full History
                          </button>
                       </div>
                    </div>
                 </div>
               )}

               {(activeTab === 'concept' || activeTab === 'problem') && (
                 <div className="max-w-6xl mx-auto space-y-12">
                   {selectedDomain ? (
                    <div>
                      <button onClick={() => setSelectedDomain(null)} className="flex items-center gap-2 text-slate-400 hover:text-white mb-8 group">
                        <Icon.ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" /> Back to Sections
                      </button>
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {(activeTab === 'concept' ? conceptDomains : problemDomains)
                          .find(d => d.id === selectedDomain)?.subDomains.map(sub => (
                          <button key={sub.id} onClick={() => navigate(`${activeTab === 'concept' ? '/assessment' : '/problem-assessment'}?domain=${selectedDomain}&subtopic=${sub.id}`)}
                            className="bg-slate-900/40 border border-slate-800 p-6 rounded-2xl hover:border-blue-500/50 transition-all text-left group">
                            <div className="flex items-center justify-between mb-4">
                               <div className="w-10 h-10 rounded-xl bg-slate-800 flex items-center justify-center text-blue-400 group-hover:scale-110 transition-transform">
                                  <Icon.BookOpen className="w-5 h-5" />
                               </div>
                               <span className="text-[10px] font-bold uppercase py-1 px-2 rounded-md bg-slate-800 text-slate-400">{sub.difficulty}</span>
                            </div>
                            <h4 className="font-bold text-white mb-1">{sub.title}</h4>
                            <p className="text-xs text-slate-500">Personalized pathway ready.</p>
                          </button>
                        ))}
                      </div>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                      {(activeTab === 'concept' ? conceptDomains : problemDomains).map(domain => {
                        const style = colorMap[domain.color] || colorMap.blue;
                        return (
                          <button key={domain.id} onClick={() => handleSelection(domain.id)}
                            className={`p-6 rounded-2xl border ${style.border} ${style.bg} ${style.hover} transition-all text-left relative group overflow-hidden`}>
                            <div className="relative z-10">
                              <div className={`w-12 h-12 rounded-2xl ${style.bg} border ${style.border} flex items-center justify-center mb-6`}>
                                 {activeTab === 'concept' ? <Icon.BookOpen className={`w-6 h-6 ${style.icon}`} /> : <Icon.Code className={`w-6 h-6 ${style.icon}`} />}
                              </div>
                              <h3 className="text-xl font-bold text-white mb-2">{domain.title}</h3>
                              <p className="text-sm text-slate-400 mb-6 leading-relaxed">{domain.description}</p>
                              <div className="flex items-center gap-2 text-xs font-bold text-white/50 group-hover:text-white transition-colors">
                                 EXPLORE <Icon.ChevronRight className="w-3 h-3" />
                              </div>
                            </div>
                          </button>
                        );
                      })}
                    </div>
                  )}
                </div>
              )}

              {activeTab === 'exam' && (
                <div className="max-w-4xl mx-auto space-y-6">
                   <div className="mb-10 text-center">
                      <h1 className="text-4xl font-black text-white mb-4">Interview Simulator</h1>
                      <p className="text-slate-400">Adaptive mock interviews tailored to your target company.</p>
                   </div>
                   <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                      {examDomains.map(exam => (
                         <button key={exam.id} onClick={() => handleSelection(exam.id)}
                           className="bg-slate-900/50 border border-slate-800 p-8 rounded-2xl hover:border-blue-500/50 transition-all text-left relative group">
                            <div className="w-16 h-16 rounded-2xl bg-blue-500/10 flex items-center justify-center text-blue-400 mb-8 group-hover:scale-110 transition-transform">
                               <Icon.Award className="w-8 h-8" />
                            </div>
                            <span className="absolute top-8 right-8 text-[10px] font-black uppercase text-blue-500 bg-blue-500/10 px-3 py-1 rounded-full border border-blue-500/20">{exam.badge}</span>
                            <h3 className="text-2xl font-bold text-white mb-4">{exam.title}</h3>
                            <p className="text-slate-400 text-sm leading-relaxed mb-8">{exam.description}</p>
                            <div className="flex items-center gap-2 text-xs font-bold text-blue-400">
                               START SIMULATION <Icon.ChevronRight className="w-3 h-3" />
                            </div>
                         </button>
                      ))}
                   </div>
                </div>
              )}

               {activeTab === 'settings' && (
                  <div className="max-w-4xl mx-auto py-10 space-y-12">
                     <div>
                        <h1 className="text-4xl font-black text-white mb-2 tracking-tight">System Settings</h1>
                        <p className="text-slate-400 font-medium">Configure your AI workspace behavior and appearance.</p>
                     </div>

                     <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                        {/* Appearance Card */}
                        <div className="bg-slate-900/40 border border-slate-800 rounded-2xl p-8 backdrop-blur-md">
                           <h3 className="text-sm font-black text-white uppercase tracking-widest mb-8 flex items-center gap-3">
                              <Icon.Settings className={`w-4 h-4 ${currentTheme.accent}`} />
                              Appearance
                           </h3>
                           
                           <div className="space-y-8">
                              <div>
                                 <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest block mb-4">Workspace Theme</label>
                                 <div className="grid grid-cols-2 gap-4">
                                    <button 
                                      onClick={() => setTheme('glass')}
                                      className={`p-4 rounded-2xl border transition-all text-left group ${theme === 'glass' ? `${currentTheme.bg} ${currentTheme.border} border-opacity-100` : 'bg-slate-950 border-slate-800 hover:border-slate-700'}`}
                                    >
                                       <div className="text-sm font-bold text-white mb-1">Cyber Glass</div>
                                       <div className="text-[10px] text-slate-500">Translucent & Vibrant</div>
                                    </button>
                                    <button 
                                      onClick={() => setTheme('dark')}
                                      className={`p-4 rounded-2xl border transition-all text-left group ${theme === 'dark' ? 'bg-slate-800 border-white/40' : 'bg-slate-950 border-slate-800 hover:border-slate-700'}`}
                                    >
                                       <div className="text-sm font-bold text-white mb-1">Deep Dark</div>
                                       <div className="text-[10px] text-slate-500">Solid & High Contrast</div>
                                    </button>
                                 </div>
                              </div>

                              <div>
                                 <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest block mb-4">Accent Color</label>
                                 <div className="flex gap-4">
                                    {['blue', 'cyan', 'rose', 'amber'].map(color => (
                                       <button 
                                          key={color}
                                          onClick={() => updateAccent(color)}
                                          className={`w-10 h-10 rounded-full border-2 transition-all flex items-center justify-center
                                             ${color === 'blue' ? 'bg-blue-500 shadow-blue-500/20' : color === 'cyan' ? 'bg-cyan-500 shadow-cyan-500/20' : color === 'rose' ? 'bg-rose-500 shadow-rose-500/20' : 'bg-amber-500 shadow-amber-500/20'}
                                             ${accentColor === color ? 'border-white scale-110 shadow-xl' : 'border-transparent opacity-60 hover:opacity-100'}`}
                                       >
                                          {accentColor === color && <Icon.CheckCircle className="w-5 h-5 text-white" />}
                                       </button>
                                    ))}
                                 </div>
                              </div>
                           </div>
                        </div>

                        {/* AI Behavior Card */}
                        <div className="bg-slate-900/40 border border-slate-800 rounded-2xl p-8 backdrop-blur-md">
                           <h3 className="text-sm font-black text-white uppercase tracking-widest mb-8 flex items-center gap-3">
                              <Icon.Agent className={`w-4 h-4 ${currentTheme.accent}`} />
                              AI Assistant Settings
                           </h3>
                           <div className="space-y-6">
                              <div className="flex items-center justify-between p-4 bg-slate-950/50 rounded-2xl border border-slate-800">
                                 <div>
                                    <div className="text-sm font-bold text-white mb-1">High Contrast Mode</div>
                                    <div className="text-[10px] text-slate-500">Boost visibility for charts</div>
                                 </div>
                                 <div className="w-10 h-5 bg-slate-800 rounded-full relative cursor-pointer">
                                    <div className="absolute top-1 left-1 w-3 h-3 bg-slate-500 rounded-full" />
                                 </div>
                              </div>
                              <div className="flex items-center justify-between p-4 bg-slate-950/50 rounded-2xl border border-slate-800">
                                 <div>
                                    <div className="text-sm font-bold text-white mb-1">Reduced Motion</div>
                                    <div className="text-[10px] text-slate-500">Simplify UI animations</div>
                                 </div>
                                 <div className="w-10 h-5 bg-slate-800 rounded-full relative cursor-pointer">
                                    <div className="absolute top-1 left-1 w-3 h-3 bg-slate-500 rounded-full" />
                                 </div>
                              </div>
                              <div className="flex items-center justify-between p-4 bg-slate-950/50 rounded-2xl border border-slate-800">
                                 <div>
                                    <div className="text-sm font-bold text-white mb-1">Adaptive Learning</div>
                                    <div className="text-[10px] text-slate-500">AI adjusts difficulty based on performance</div>
                                 </div>
                                 <div className="w-10 h-5 bg-slate-800 rounded-full relative cursor-pointer">
                                    <div className="absolute top-1 left-3 w-3 h-3 bg-blue-500 rounded-full shadow-[0_0_8px_rgba(59,130,246,0.5)]" />
                                 </div>
                              </div>
                              <div className="flex items-center justify-between p-4 bg-slate-950/50 rounded-2xl border border-slate-800">
                                 <div>
                                    <div className="text-sm font-bold text-white mb-1">Personalized Feedback</div>
                                    <div className="text-[10px] text-slate-500">AI provides tailored insights and suggestions</div>
                                 </div>
                                 <div className="w-10 h-5 bg-slate-800 rounded-full relative cursor-pointer">
                                    <div className="absolute top-1 left-3 w-3 h-3 bg-blue-500 rounded-full shadow-[0_0_8px_rgba(59,130,246,0.5)]" />
                                 </div>
                              </div>
                              <button className={`w-full py-4 text-xs font-bold uppercase tracking-[0.2em] bg-white/5 hover:bg-white/10 border border-white/10 rounded-2xl transition-all ${currentTheme.accent}`}>
                                 Reset Progress Data
                              </button>
                           </div>
                        </div>
                     </div>
                  </div>
               )}

            </motion.div>
          </AnimatePresence>
        </main>
      </div>

      {/* Toast System */}
      <AnimatePresence>
        {notification && (
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, scale: 0.9 }}
            className="fixed bottom-10 left-1/2 -translate-x-1/2 z-100 bg-slate-900/95 backdrop-blur-2xl border border-blue-500/30 px-8 py-5 rounded-2xl shadow-3xl min-w-[320px]">
            <div className="flex items-center gap-5">
              <div className="w-12 h-12 rounded-2xl bg-blue-500/10 flex items-center justify-center border border-blue-500/20">
                <Icon.Cpu className="w-6 h-6 text-blue-400 animate-pulse" />
              </div>
              <div className="flex-1">
                <div className="text-[10px] font-black uppercase text-blue-500 mb-1">Alert</div>
                <div className="text-sm font-bold text-white">{notification}</div>
              </div>
              <button onClick={() => setNotification(null)} className="text-slate-500 hover:text-white"><Icon.LogOut className="w-4 h-4 rotate-45" /></button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
      {/* Agent Activity Trace Widget */}
      <div className="fixed bottom-8 left-4 lg:left-72 z-60 flex flex-col items-end pointer-events-none transition-all duration-500">
         <AnimatePresence>
            {activeTab !== 'settings' && (
               <motion.div 
                 initial={{ opacity: 0, scale: 0.9, y: 20 }}
                 animate={{ opacity: 1, scale: 1, y: 0 }}
                 exit={{ opacity: 0, scale: 0.9, y: 20 }}
                 className="pointer-events-auto"
               >
                  <div className={`bg-slate-900/80 backdrop-blur-2xl border border-white/10 rounded-2xl p-6 shadow-3xl transition-all duration-500 pointer-events-auto
                      ${isTraceMinimized ? 'w-56 h-12 flex items-center p-3 rounded-full cursor-pointer hover:border-blue-500/50' : 'w-80 h-auto'}`}
                      onClick={() => isTraceMinimized && setIsTraceMinimized(false)}>
                      <div className="flex items-center justify-between pointer-events-none w-full">
                         <div className="flex items-center gap-2">
                            <div className={`w-2 h-2 rounded-full animate-pulse ${currentTheme.bar}`} />
                            <span className="text-[10px] font-black uppercase text-slate-500 tracking-widest">{isTraceMinimized ? "Trace" : "Agent Analysis"}</span>
                         </div>
                         <button 
                            className="pointer-events-auto text-slate-600 hover:text-white transition-colors"
                            onClick={(e) => {
                               e.stopPropagation();
                               setIsTraceMinimized(!isTraceMinimized);
                            }}
                         >
                            {isTraceMinimized ? <Icon.ChevronRight className="w-4 h-4" /> : <Icon.ChevronDown className="w-4 h-4" />}
                         </button>
                      </div>
                      
                      {!isTraceMinimized && (
                         <div className="animate-in fade-in slide-in-from-top-2 duration-500">
                            <div className="mt-4 space-y-4 max-h-48 overflow-y-auto pr-2 custom-scrollbar">
                               {[
                                 { agent: "Coordinator", msg: "Optimizing learning path...", time: "now" },
                                 { agent: "Tutor", msg: "Generating adaptive challenges...", time: "2s ago" },
                                 { agent: "Memory", msg: "Uplinking session vectors...", time: "5s ago" }
                               ].map((log, i) => (
                                  <div key={i} className="flex gap-3">
                                     <div className="flex flex-col items-center gap-1">
                                        <div className={`w-1 h-full rounded-full ${i === 0 ? currentTheme.bar : 'bg-slate-800'}`} />
                                     </div>
                                     <div>
                                        <div className="flex items-center gap-2">
                                           <span className="text-[9px] font-bold text-white uppercase">{log.agent}</span>
                                           <span className="text-[8px] text-slate-600 font-mono">{log.time}</span>
                                        </div>
                                        <div className="text-[11px] text-slate-400 font-medium leading-relaxed">{log.msg}</div>
                                     </div>
                                  </div>
                               ))}
                            </div>

                            <div className="mt-6 pt-4 border-t border-white/5 flex items-center justify-between">
                               <div className="flex -space-x-2">
                                  {[1, 2, 3].map(i => (
                                     <div key={i} className={`w-6 h-6 rounded-full border-2 border-slate-900 ${i === 1 ? 'bg-blue-500' : i === 2 ? 'bg-purple-500' : 'bg-cyan-500'} flex items-center justify-center text-[8px] font-bold text-white`}>
                                        {i === 1 ? 'C' : i === 2 ? 'T' : 'E'}
                                     </div>
                                  ))}
                               </div>
                               <span className="text-[9px] font-bold text-slate-500 uppercase tracking-widest">3 Agents active</span>
                            </div>
                         </div>
                      )}
                   </div>
               </motion.div>
            )}
         </AnimatePresence>
      </div>
    </div>
  );
};

export default Dashboard;

