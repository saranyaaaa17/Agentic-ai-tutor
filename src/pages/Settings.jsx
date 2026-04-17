import { AnimatePresence, motion } from "framer-motion";
import { useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import Logo from "../components/layout/logo";
import { useAuth } from "../context/AuthContext";
import { useSettings } from "../context/SettingsContext";

const Icon = {
  ArrowLeft: (p) => <svg {...p} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="19" y1="12" x2="5" y2="12" /><polyline points="12 19 5 12 12 5" /></svg>,
  Grid: (p) => <svg {...p} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="3" width="7" height="7" /><rect x="14" y="3" width="7" height="7" /><rect x="14" y="14" width="7" height="7" /><rect x="3" y="14" width="7" height="7" /></svg>,
  User: (p) => <svg {...p} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" /><circle cx="12" cy="7" r="4" /></svg>,
  Settings: (p) => <svg {...p} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="3" /><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33A1.65 1.65 0 0 0 14 21a2 2 0 1 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.6 15 1.65 1.65 0 0 0 3.09 14H3a2 2 0 1 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68 1.65 1.65 0 0 0 10 3.17V3a2 2 0 1 1 4 0v.09A1.65 1.65 0 0 0 15 4.6a1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9c0 .69.28 1.35.77 1.84.49.49 1.15.76 1.84.76a2 2 0 1 1 0 4h-.09A1.65 1.65 0 0 0 19.4 15z" /></svg>,
  Globe: (p) => <svg {...p} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10" /><line x1="2" y1="12" x2="22" y2="12" /><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" /></svg>,
  Moon: (p) => <svg {...p} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" /></svg>,
  Brain: (p) => <svg {...p} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M9.5 2A2.5 2.5 0 0 1 12 4.5v15a2.5 2.5 0 0 1-4.96-.46 2.5 2.5 0 0 1-2.96-3.08 3 3 0 0 1-.34-5.58 2.5 2.5 0 0 1 1.32-4.24 2.5 2.5 0 0 1 1.98-3A2.5 2.5 0 0 1 9.5 2z" /><path d="M14.5 2A2.5 2.5 0 0 0 12 4.5v15a2.5 2.5 0 0 0 4.96-.46 2.5 2.5 0 0 0 2.96-3.08 3 3 0 0 0 .34-5.58 2.5 2.5 0 0 0-1.32-4.24 2.5 2.5 0 0 0-1.98-3A2.5 2.5 0 0 0 14.5 2z" /></svg>,
  LifeBuoy: (p) => <svg {...p} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10" /><circle cx="12" cy="12" r="4" /><line x1="4.93" y1="4.93" x2="9.17" y2="9.17" /><line x1="14.83" y1="14.83" x2="19.07" y2="19.07" /><line x1="14.83" y1="9.17" x2="19.07" y2="4.93" /><line x1="4.93" y1="19.07" x2="9.17" y2="14.83" /></svg>,
  UserPlus: (p) => <svg {...p} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" /><circle cx="8.5" cy="7" r="4" /><line x1="20" y1="8" x2="20" y2="14" /><line x1="23" y1="11" x2="17" y2="11" /></svg>,
  LogOut: (p) => <svg {...p} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" /><polyline points="16 17 21 12 16 7" /><line x1="21" y1="12" x2="9" y2="12" /></svg>,
  CheckCircle: (p) => <svg {...p} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" /><polyline points="22 4 12 14.01 9 11.01" /></svg>,
  ChevronRight: (p) => <svg {...p} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="9 18 15 12 9 6" /></svg>
};

const languageOptions = [
  { value: "auto", label: "Auto-detect" },
  { value: "en-US", label: "English (US)" },
  { value: "en-GB", label: "English (UK)" },
  { value: "hi-IN", label: "Hindi" },
  { value: "es-ES", label: "Spanish" },
  { value: "fr-FR", label: "French" }
];

const appearanceOptions = [
  { value: "system", title: "System", description: "Follow your device preference." },
  { value: "dark", title: "Deep Dark", description: "High contrast for long sessions." },
  { value: "light", title: "Soft Light", description: "A brighter day-time workspace." }
];

const accentOptions = [
  { value: "blue", label: "Blue", swatch: "bg-blue-500" },
  { value: "cyan", label: "Cyan", swatch: "bg-cyan-500" },
  { value: "rose", label: "Rose", swatch: "bg-rose-500" },
  { value: "amber", label: "Amber", swatch: "bg-amber-500" },
  { value: "green", label: "Green", swatch: "bg-green-500" },
  { value: "purple", label: "Purple", swatch: "bg-purple-500" },
  { value: "orange", label: "Orange", swatch: "bg-orange-500" }
];

const Toggle = ({ enabled, onClick }) => (
  <button type="button" onClick={onClick} className={`relative h-7 w-14 rounded-full border border-white/10 transition-all ${enabled ? "bg-[var(--accent-primary)] shadow-[0_0_20px_var(--accent-secondary)]" : "bg-slate-800"}`}>
    <span className={`absolute top-1 h-5 w-5 rounded-full bg-white transition-all ${enabled ? "left-8" : "left-1"}`} />
  </button>
);

const Settings = () => {
  const { resolvedTheme, appearance, setAppearance, accentColor, setAccentColor, language, setLanguage, spokenLanguage, setSpokenLanguage, socraticMode, setSocraticMode } = useSettings();
  const { signOut, user } = useAuth();
  const navigate = useNavigate();
  const [activeSection, setActiveSection] = useState("general");
  const contentRef = useRef(null);

  const navItems = [
    { id: "general", label: "General", icon: Icon.Settings, description: "Language, visuals and tutor defaults" },
    { id: "support", label: "Help & Support", icon: Icon.LifeBuoy, description: "Guidance and extension space" },
    { id: "accounts", label: "Accounts", icon: Icon.UserPlus, description: "Profile access and session state" }
  ];

  const currentLanguage = useMemo(() => languageOptions.find((item) => item.value === language)?.label || "English (US)", [language]);
  const currentSpoken = useMemo(() => languageOptions.find((item) => item.value === spokenLanguage)?.label || "English (US)", [spokenLanguage]);

  const pageClass = "bg-bg-primary text-text-primary";
  const cardClass = "bg-bg-secondary/70 border-border-primary shadow-xl backdrop-blur-md";
  const muteClass = "text-text-secondary";
  const chipClass = "border-border-primary bg-bg-surface/60";
  const inputClass = "bg-bg-surface/70 border-border-primary text-text-primary";

  const handleSignOut = async () => {
    try {
      await signOut();
      navigate("/");
    } catch (error) {
      console.error("Error signing out:", error);
    }
  };

  const handleSectionChange = (sectionId) => {
    setActiveSection(sectionId);
    window.setTimeout(() => {
      contentRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
    }, 120);
  };

  return (
    <div className={`min-h-screen font-sans transition-colors duration-500 ${pageClass}`}>
      <header className="sticky top-0 z-40 border-b border-border-primary bg-bg-primary/70 backdrop-blur-xl">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-6">
          <Logo />
          <div className="flex items-center gap-3 text-sm">
            <button onClick={() => navigate("/dashboard")} className={`flex items-center gap-2 rounded-full px-4 py-2 transition-colors text-text-secondary hover:bg-white/5 hover:text-text-primary`}>
              <Icon.ArrowLeft className="h-4 w-4" />
              Dashboard
            </button>
            <button onClick={() => navigate("/profile")} className={`rounded-full px-4 py-2 transition-colors text-text-secondary hover:bg-white/5 hover:text-text-primary`}>
              Profile
            </button>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-7xl px-6 py-10">
        <div className="grid gap-8 lg:grid-cols-[300px_minmax(0,1fr)]">
          <aside className={`rounded-[28px] border p-6 ${cardClass}`}>
            <div className="mb-8 flex items-center gap-4">
              <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-[var(--accent-secondary)] text-[var(--accent-primary)]">
                <Icon.Settings className="h-8 w-8" />
              </div>
              <div>
                <p className="text-[11px] font-black uppercase tracking-[0.28em] text-[var(--accent-primary)]">Workspace</p>
                <h1 className="mt-1 text-2xl font-black tracking-tight">Settings Hub</h1>
              </div>
            </div>

            <div className={`mb-6 rounded-[24px] border p-5 ${chipClass}`}>
              <p className="text-[10px] font-black uppercase tracking-[0.24em] text-[var(--accent-primary)] opacity-70">Current Setup</p>
              <div className="mt-4 space-y-3">
                <div className="flex items-center justify-between text-xs"><span className={muteClass}>Appearance</span><span className="font-bold capitalize">{appearance}</span></div>
                <div className="flex items-center justify-between text-xs"><span className={muteClass}>Language</span><span className="font-bold">{currentLanguage}</span></div>
                <div className="flex items-center justify-between text-xs"><span className={muteClass}>Tutor style</span><span className={`font-bold ${socraticMode ? "text-emerald-400" : muteClass}`}>{socraticMode ? "Socratic" : "Direct"}</span></div>
              </div>
            </div>

            <div className="space-y-2">
              {navItems.map((item) => {
                const ActiveIcon = item.icon;
                const active = activeSection === item.id;
                return (
                  <button key={item.id} type="button" onClick={() => handleSectionChange(item.id)} className={`w-full rounded-2xl border p-4 text-left transition-all ${active ? "border-[var(--accent-primary)] bg-[var(--accent-secondary)]" : resolvedTheme === "light" ? "border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50" : "border-white/5 bg-white/[0.02] hover:border-white/15 hover:bg-white/[0.04]"}`}>
                    <div className="flex items-start gap-3">
                      <div className={`mt-0.5 flex h-11 w-11 items-center justify-center rounded-2xl ${active ? "bg-[var(--accent-primary)]/15 text-[var(--accent-primary)]" : resolvedTheme === "light" ? "bg-slate-100 text-slate-500" : "bg-slate-800/80 text-slate-400"}`}>
                        <ActiveIcon className="h-5 w-5" />
                      </div>
                      <div className="min-w-0">
                        <div className="flex items-center justify-between gap-3">
                          <span className="text-sm font-bold">{item.label}</span>
                          <Icon.ChevronRight className={`h-4 w-4 ${active ? "translate-x-1 text-[var(--accent-primary)]" : muteClass}`} />
                        </div>
                        <p className={`mt-1 text-xs leading-relaxed ${muteClass}`}>{item.description}</p>
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>

            <div className={`mt-6 rounded-[24px] border p-4 ${resolvedTheme === "light" ? "border-rose-200 bg-rose-50" : "border-rose-500/10 bg-rose-500/5"}`}>
              <div className="flex flex-col gap-3">
                <div className="flex items-center gap-3">
                  <div className={`flex h-10 w-10 items-center justify-center rounded-xl ${resolvedTheme === "light" ? "bg-rose-100 text-rose-500" : "bg-rose-500/10 text-rose-400"}`}>
                    <Icon.LogOut className="h-4 w-4" />
                  </div>
                  <h2 className="text-sm font-bold">Sign out</h2>
                </div>
                <p className={`text-[11px] leading-5 ${muteClass}`}>Preferences stay stored locally after you leave the session.</p>
                <button type="button" onClick={handleSignOut} className={`w-full rounded-xl px-4 py-2 text-xs font-bold transition-all shadow-sm ${resolvedTheme === "light" ? "bg-rose-500 text-white hover:bg-rose-600" : "bg-rose-500/15 text-rose-300 hover:bg-rose-500/25 border border-rose-500/20"}`}>
                  Sign Out of Workspace
                </button>
              </div>
            </div>
          </aside>

          <section ref={contentRef} className="space-y-6">
            <AnimatePresence mode="wait">
              {activeSection === "general" && (
                <motion.div key="general" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} className="space-y-6">
                  <div className={`rounded-[32px] border p-7 ${cardClass}`}>
                    <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
                      <div className="flex-1 max-w-2xl">
                        <p className="text-[10px] font-black uppercase tracking-[0.3em] text-[var(--accent-primary)] mb-2">General Overview</p>
                        <h2 className="text-3xl font-black tracking-tight leading-[1.15]">A cleaner settings experience that matches the rest of the product.</h2>
                        <p className={`mt-4 text-xs leading-6 max-w-xl ${muteClass}`}>Polished card system as dashboard, profile, and interview-prep modules while preserving the same saved settings.</p>
                      </div>
                      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3 shrink-0">
                        <div className={`rounded-2xl border px-4 py-3 min-w-[120px] ${chipClass}`}><p className="text-[9px] font-black uppercase tracking-widest text-[var(--accent-primary)] opacity-60">Language</p><p className="mt-1 text-xs font-bold">{currentLanguage}</p></div>
                        <div className={`rounded-2xl border px-4 py-3 min-w-[120px] ${chipClass}`}><p className="text-[9px] font-black uppercase tracking-widest text-[var(--accent-primary)] opacity-60">Voice</p><p className="mt-1 text-xs font-bold">{currentSpoken}</p></div>
                        <div className={`rounded-2xl border px-4 py-3 min-w-[120px] ${chipClass}`}><p className="text-[9px] font-black uppercase tracking-widest text-[var(--accent-primary)] opacity-60">Tutor</p><p className="mt-1 text-xs font-bold">{socraticMode ? "Socratic" : "Direct"}</p></div>
                      </div>
                    </div>
                  </div>

                  <div className="grid gap-6 xl:grid-cols-2">
                    <div className={`rounded-[28px] border p-7 ${cardClass}`}>
                      <div className="mb-6 flex items-center gap-3">
                        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[var(--accent-secondary)] text-[var(--accent-primary)]"><Icon.Globe className="h-5 w-5" /></div>
                        <div><p className="text-[10px] font-black uppercase tracking-[0.24em] text-[var(--accent-primary)]">Communication</p><h3 className="mt-1 text-lg font-black">Language Preferences</h3></div>
                      </div>
                      <div className="space-y-4">
                        <div className={`rounded-3xl border p-5 ${chipClass}`}>
                          <label className="mb-1 block text-sm font-bold">App language</label>
                          <p className={`mb-3 text-[11px] leading-5 ${muteClass}`}>Interface language across learning modules.</p>
                          <select value={language} onChange={(e) => setLanguage(e.target.value)} className={`w-full rounded-xl border px-4 py-2.5 text-xs font-semibold outline-none transition-all ${inputClass}`}>
                            {languageOptions.map((item) => <option key={item.value} value={item.value}>{item.label}</option>)}
                          </select>
                        </div>
                        <div className={`rounded-3xl border p-5 ${chipClass}`}>
                          <label className="mb-1 block text-sm font-bold">Spoken language</label>
                          <p className={`mb-3 text-[11px] leading-5 ${muteClass}`}>Voice tutoring and Socratic interactions.</p>
                          <select value={spokenLanguage} onChange={(e) => setSpokenLanguage(e.target.value)} className={`w-full rounded-xl border px-4 py-2.5 text-xs font-semibold outline-none transition-all ${inputClass}`}>
                            {languageOptions.map((item) => <option key={item.value} value={item.value}>{item.label}</option>)}
                          </select>
                        </div>
                      </div>
                    </div>

                    <div className={`rounded-[28px] border p-7 ${cardClass}`}>
                      <div className="mb-6 flex items-center gap-3">
                        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[var(--accent-secondary)] text-[var(--accent-primary)]"><Icon.Moon className="h-5 w-5" /></div>
                        <div><p className="text-[10px] font-black uppercase tracking-[0.24em] text-[var(--accent-primary)]">Visual System</p><h3 className="mt-1 text-lg font-black">Appearance & Accent</h3></div>
                      </div>
                      <div className="space-y-4">
                        <div>
                          <p className="mb-3 text-[13px] font-bold">Workspace theme</p>
                          <div className="grid gap-3 md:grid-cols-3">
                            {appearanceOptions.map((item) => {
                              const selected = appearance === item.value;
                              return (
                                <button key={item.value} type="button" onClick={() => setAppearance(item.value)} className={`rounded-2xl border p-4 text-left transition-all ${selected ? "border-[var(--accent-primary)] bg-[var(--accent-secondary)] shadow-sm" : chipClass}`}>
                                  <div className="flex items-center justify-between"><span className="text-[13px] font-bold">{item.title}</span>{selected && <Icon.CheckCircle className="h-4 w-4 text-[var(--accent-primary)]" />}</div>
                                  <p className={`mt-2 text-[11px] leading-5 ${muteClass}`}>{item.description}</p>
                                </button>
                              );
                            })}
                          </div>
                        </div>
                        <div>
                          <p className="mb-3 text-sm font-bold">Accent palette</p>
                          <div className="flex flex-wrap gap-3">
                            {accentOptions.map((item) => {
                              const selected = accentColor === item.value;
                              return (
                                <button key={item.value} type="button" onClick={() => setAccentColor(item.value)} className={`flex items-center gap-2 rounded-full border px-3 py-2 text-sm font-semibold transition-all ${selected ? resolvedTheme === "light" ? "border-slate-900 bg-slate-900 text-white" : "border-white bg-white text-slate-950" : chipClass}`}>
                                  <span className={`h-3 w-3 rounded-full ${item.swatch}`} />
                                  {item.label}
                                </button>
                              );
                            })}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className={`rounded-[28px] border p-7 ${cardClass}`}>
                    <div className="mb-6 flex items-center gap-3">
                      <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[var(--accent-secondary)] text-[var(--accent-primary)]"><Icon.Brain className="h-5 w-5" /></div>
                      <div><p className="text-[10px] font-black uppercase tracking-[0.24em] text-[var(--accent-primary)]">AI Behavior</p><h3 className="mt-1 text-lg font-black">Tutor Guidance Style</h3></div>
                    </div>
                    <div className={`rounded-3xl border p-5 ${chipClass}`}>
                      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                        <div className="max-w-xl">
                          <h4 className="text-sm font-bold">Socratic Mode</h4>
                          <p className={`mt-2 text-sm leading-7 ${muteClass}`}>Guide learning with probing questions and stepwise hints instead of directly jumping to the final answer.</p>
                        </div>
                        <Toggle enabled={socraticMode} onClick={() => setSocraticMode(!socraticMode)} />
                      </div>
                    </div>
                  </div>
                </motion.div>
              )}

              {activeSection === "support" && (
                <motion.div key="support" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} className={`rounded-[32px] border p-8 ${cardClass}`}>
                  <p className="text-[11px] font-black uppercase tracking-[0.32em] text-[var(--accent-primary)]">Support Paths</p>
                  <h2 className="mt-3 text-3xl font-black tracking-tight">A purposeful support panel instead of an empty placeholder.</h2>
                  <p className={`mt-3 max-w-2xl text-sm leading-7 ${muteClass}`}>This space now matches the other modules visually and can grow into FAQs, bug reporting, onboarding tips, or release notes later.</p>
                  <div className="mt-8 grid gap-4 md:grid-cols-2">
                    {[
                      ["Learning Guidance", "Use Socratic mode when you want coaching rather than direct solutions."],
                      ["Theme Tuning", "Choose the combination that feels readable across dashboard and challenge pages."],
                      ["Voice Readiness", "Set spoken language before using voice-based interactions."],
                      ["Session Safety", "Signing out keeps your saved local preferences intact."]
                    ].map(([title, copy]) => (
                      <div key={title} className={`rounded-2xl border p-5 ${chipClass}`}>
                        <h3 className="text-sm font-bold">{title}</h3>
                        <p className={`mt-2 text-sm leading-7 ${muteClass}`}>{copy}</p>
                      </div>
                    ))}
                  </div>
                </motion.div>
              )}

              {activeSection === "accounts" && (
                <motion.div key="accounts" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} className={`rounded-[32px] border p-8 ${cardClass}`}>
                  <p className="text-[11px] font-black uppercase tracking-[0.32em] text-[var(--accent-primary)]">Account Overview</p>
                  <h2 className="mt-3 text-3xl font-black tracking-tight">Profile access and session state in the new module pattern.</h2>
                  <div className="mt-8 grid gap-4 md:grid-cols-2">
                    <div className={`rounded-2xl border p-5 ${chipClass}`}>
                      <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-2xl bg-[var(--accent-secondary)] text-[var(--accent-primary)]"><Icon.User className="h-6 w-6" /></div>
                      <p className={`text-xs uppercase tracking-[0.24em] ${muteClass}`}>Signed in as</p>
                      <p className="mt-2 break-all text-lg font-bold">{user?.email || "No active user"}</p>
                    </div>
                    <div className={`rounded-2xl border p-5 ${chipClass}`}>
                      <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-2xl bg-[var(--accent-secondary)] text-[var(--accent-primary)]"><Icon.Grid className="h-6 w-6" /></div>
                      <p className={`text-xs uppercase tracking-[0.24em] ${muteClass}`}>Quick links</p>
                      <div className="mt-3 flex flex-wrap gap-3">
                        <button type="button" onClick={() => navigate("/dashboard")} className={`rounded-full px-4 py-2 text-sm font-semibold transition-colors ${resolvedTheme === "light" ? "bg-slate-900 text-white hover:bg-slate-800" : "bg-white/10 text-white hover:bg-white/15"}`}>Open Dashboard</button>
                        <button type="button" onClick={() => navigate("/profile")} className={`rounded-full px-4 py-2 text-sm font-semibold transition-colors ${resolvedTheme === "light" ? "bg-slate-100 text-slate-700 hover:bg-slate-200" : "bg-slate-950/70 text-slate-300 hover:bg-slate-800"}`}>Open Profile</button>
                      </div>
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </section>
        </div>
      </main>
    </div>
  );
};

export default Settings;
