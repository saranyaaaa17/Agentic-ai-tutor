import { AnimatePresence, motion } from "framer-motion";
import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import Logo from "../components/layout/logo";
import MasteryRadar from "../components/MasteryRadar";
import { useAuth } from "../context/AuthContext";
import { supabase } from "../lib/supabase";
import { getDailyChallengeState } from "../utils/dailyChallenge";
import { getRecentMilestones } from "../utils/learningActivity";
import { fetchMasteryFromSupabase, normalizeMasteryScore } from "../utils/syncUtils";

const formatMasteryPercent = (value) => `${Math.round(normalizeMasteryScore(value) * 100)}%`;
const masteryWidth = (value) => `${normalizeMasteryScore(value) * 100}%`;

const Icon = {
  ArrowLeft: (p) => <svg {...p} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="19" y1="12" x2="5" y2="12" /><polyline points="12 19 5 12 12 5" /></svg>,
  User: (p) => <svg {...p} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" /><circle cx="12" cy="7" r="4" /></svg>,
  Chart: (p) => <svg {...p} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="18" y1="20" x2="18" y2="10" /><line x1="12" y1="20" x2="12" y2="4" /><line x1="6" y1="20" x2="6" y2="14" /><line x1="2" y1="20" x2="22" y2="20" /></svg>,
  Edit: (p) => <svg {...p} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 20h9" /><path d="M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4Z" /></svg>,
  Shield: (p) => <svg {...p} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" /></svg>,
  Flame: (p) => <svg {...p} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M8.5 14.5A2.5 2.5 0 0 0 11 12c0-1.38-.5-2-1-3-1.072-2.143-.224-4.054 2-6 .5 2.5 2 4.9 4 6.5 2 1.6 3 3.5 3 5.5a7 7 0 1 1-14 0c0-1.153.433-2.294 1-3a2.5 2.5 0 0 0 2.5 3z" /></svg>,
  Zap: (p) => <svg {...p} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" /></svg>,
  LogOut: (p) => <svg {...p} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" /><polyline points="16 17 21 12 16 7" /><line x1="21" y1="12" x2="9" y2="12" /></svg>,
  CheckCircle: (p) => <svg {...p} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" /><polyline points="22 4 12 14.01 9 11.01" /></svg>
};

const defaultMastery = {
  DSA: 0,
  Recursion: 0,
  Graphs: 0,
  "System Design": 0,
  Logic: 0
};

const Profile = () => {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();
  const [displayName, setDisplayName] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState(null);
  const [masteryData, setMasteryData] = useState(defaultMastery);
  const [challengeState, setChallengeState] = useState(() => getDailyChallengeState());
  const [recentMilestones, setRecentMilestones] = useState(() => getRecentMilestones(4));

  useEffect(() => {
    if (user?.user_metadata?.display_name) {
      setDisplayName(user.user_metadata.display_name);
    }
  }, [user]);

  useEffect(() => {
    const loadMastery = async () => {
      if (!user?.id) return;
      const cloudMastery = await fetchMasteryFromSupabase(user.id);
      if (cloudMastery && Object.keys(cloudMastery).length > 0) {
        setMasteryData((current) => ({ ...current, ...cloudMastery }));
      }
    };

    loadMastery();
  }, [user]);

  useEffect(() => {
    const refreshSignals = () => {
      setChallengeState(getDailyChallengeState());
      setRecentMilestones(getRecentMilestones(4));
    };

    refreshSignals();
    window.addEventListener("focus", refreshSignals);
    return () => window.removeEventListener("focus", refreshSignals);
  }, []);

  const initial = (displayName || user?.email || "?").charAt(0).toUpperCase();
  const userName = displayName || user?.email?.split("@")[0] || "Learner";
  const masteryEntries = Object.entries(masteryData);
  const strongestSkill = useMemo(
    () => masteryEntries.reduce((best, current) => normalizeMasteryScore(current[1]) > normalizeMasteryScore(best[1]) ? current : best, masteryEntries[0] || ["None", 0]),
    [masteryEntries]
  );
  const weakestSkill = useMemo(
    () => masteryEntries.reduce((best, current) => normalizeMasteryScore(current[1]) < normalizeMasteryScore(best[1]) ? current : best, masteryEntries[0] || ["None", 0]),
    [masteryEntries]
  );
  const readiness = masteryEntries.length
    ? Math.round((masteryEntries.reduce((sum, [, value]) => sum + normalizeMasteryScore(value), 0) / masteryEntries.length) * 100)
    : 0;

  const updateProfile = async () => {
    try {
      setLoading(true);
      setMessage(null);
      const { error } = await supabase.auth.updateUser({ data: { display_name: displayName } });
      if (error) throw error;
      setMessage({ type: "success", text: "Profile updated successfully." });
      setTimeout(() => setMessage(null), 3000);
    } catch (error) {
      setMessage({ type: "error", text: "Error updating profile. Please try again." });
    } finally {
      setLoading(false);
    }
  };

  const handleSignOut = async () => {
    try {
      await signOut();
      navigate("/");
    } catch (error) {
      console.error("Error signing out:", error);
    }
  };

  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top_left,rgba(59,130,246,0.18),transparent_28%),radial-gradient(circle_at_top_right,rgba(34,211,238,0.08),transparent_20%),#020617] text-slate-100 font-sans">
      <header className="sticky top-0 z-40 border-b border-white/10 bg-slate-950/70 backdrop-blur-xl">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-6">
          <Logo />
          <div className="flex items-center gap-3 text-sm">
            <button onClick={() => navigate("/dashboard")} className="flex items-center gap-2 rounded-full px-4 py-2 text-slate-400 transition-colors hover:bg-white/5 hover:text-white">
              <Icon.ArrowLeft className="h-4 w-4" />
              Dashboard
            </button>
            <button onClick={() => navigate("/settings")} className="rounded-full px-4 py-2 text-slate-400 transition-colors hover:bg-white/5 hover:text-white">
              Settings
            </button>
          </div>
        </div>
      </header>

      <AnimatePresence>
        {message && (
          <motion.div
            initial={{ opacity: 0, y: -16 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.96 }}
            className={`fixed left-1/2 top-20 z-50 -translate-x-1/2 rounded-2xl border px-5 py-3 text-sm font-semibold shadow-xl backdrop-blur-md ${
              message.type === "success"
                ? "border-emerald-500/20 bg-emerald-500/10 text-emerald-300"
                : "border-rose-500/20 bg-rose-500/10 text-rose-300"
            }`}
          >
            {message.text}
          </motion.div>
        )}
      </AnimatePresence>

      <main className="mx-auto max-w-7xl px-6 py-8 space-y-6">
        <motion.section initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="rounded-[32px] border border-white/10 bg-slate-900/70 p-8 shadow-[0_28px_80px_rgba(2,6,23,0.6)]">
          <div className="grid gap-8 xl:grid-cols-[minmax(0,1.35fr)_minmax(340px,0.95fr)] xl:items-center">
            <div className="flex items-center gap-5">
              <div className="flex h-24 w-24 items-center justify-center rounded-[28px] bg-[var(--accent-secondary)] text-4xl font-black text-[var(--accent-primary)] shadow-[0_18px_40px_rgba(15,23,42,0.35)]">
                {initial}
              </div>
              <div>
                <p className="text-[11px] font-black uppercase tracking-[0.32em] text-[var(--accent-primary)]">Learner Profile</p>
                <h1 className="mt-2 text-4xl font-black tracking-tight text-white">{userName}</h1>
                <p className="mt-2 text-sm text-slate-400">{user?.email}</p>
              </div>
            </div>

            <div className="grid gap-3 sm:grid-cols-3">
              <div className="rounded-2xl border border-white/10 bg-slate-950/60 px-4 py-4">
                <p className="text-[10px] font-black uppercase tracking-[0.25em] text-[var(--accent-primary)]">Readiness</p>
                <p className="mt-2 text-2xl font-black text-white">{readiness}%</p>
              </div>
              <div className="rounded-2xl border border-white/10 bg-slate-950/60 px-4 py-4">
                <p className="text-[10px] font-black uppercase tracking-[0.25em] text-[var(--accent-primary)]">Strongest</p>
                <p className="mt-2 text-sm font-bold text-white">{strongestSkill[0]}</p>
              </div>
              <div className="rounded-2xl border border-white/10 bg-slate-950/60 px-4 py-4">
                <p className="text-[10px] font-black uppercase tracking-[0.25em] text-[var(--accent-primary)]">Focus Next</p>
                <p className="mt-2 text-sm font-bold text-white">{weakestSkill[0]}</p>
              </div>
            </div>
          </div>
        </motion.section>

        <div className="grid gap-6 xl:grid-cols-12">
          <section className="space-y-6 xl:col-span-7">
            <div className="rounded-[28px] border border-white/10 bg-slate-900/70 p-7 shadow-[0_24px_70px_rgba(2,6,23,0.5)]">
              <div className="mb-6 flex items-center gap-3">
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[var(--accent-secondary)] text-[var(--accent-primary)]">
                  <Icon.Chart className="h-6 w-6" />
                </div>
                <div>
                  <p className="text-[11px] font-black uppercase tracking-[0.28em] text-[var(--accent-primary)]">Mastery Snapshot</p>
                  <h2 className="mt-1 text-xl font-black text-white">Skill profile overview</h2>
                </div>
              </div>

              <div className="grid gap-6 lg:grid-cols-[minmax(280px,0.95fr)_minmax(0,1.05fr)]">
                <div className="rounded-[24px] border border-white/10 bg-slate-950/60 p-4">
                  <MasteryRadar masteryProfile={masteryData} />
                </div>
                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-1">
                  {masteryEntries.map(([label, value]) => (
                    <div key={label} className="rounded-2xl border border-white/10 bg-slate-950/50 p-4">
                      <div className="mb-2 flex items-center justify-between text-[11px] font-black uppercase tracking-[0.24em]">
                        <span className={normalizeMasteryScore(value) < 0.4 ? "text-amber-400" : "text-[var(--accent-primary)]"}>{label}</span>
                        <span className="text-slate-400">{formatMasteryPercent(value)}</span>
                      </div>
                      <div className="h-2 overflow-hidden rounded-full bg-slate-800">
                        <motion.div
                          initial={{ width: 0 }}
                          animate={{ width: masteryWidth(value) }}
                          className={`h-full rounded-full ${normalizeMasteryScore(value) < 0.4 ? "bg-amber-500" : "bg-[var(--accent-primary)]"}`}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className="rounded-[28px] border border-white/10 bg-slate-900/70 p-7 shadow-[0_24px_70px_rgba(2,6,23,0.5)]">
              <div className="mb-6 flex items-center gap-3">
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-orange-500/10 text-orange-400">
                  <Icon.Flame className="h-6 w-6" />
                </div>
                <div>
                  <p className="text-[11px] font-black uppercase tracking-[0.28em] text-orange-400">Daily Momentum</p>
                  <h2 className="mt-1 text-xl font-black text-white">Challenge streak and today status</h2>
                </div>
              </div>

              <div className="grid gap-4 md:grid-cols-3">
                <div className="rounded-2xl border border-white/10 bg-slate-950/50 p-4">
                  <p className="text-[10px] font-black uppercase tracking-[0.24em] text-slate-500">Current Streak</p>
                  <p className="mt-2 text-2xl font-black text-white">{challengeState.streak}</p>
                </div>
                <div className="rounded-2xl border border-white/10 bg-slate-950/50 p-4">
                  <p className="text-[10px] font-black uppercase tracking-[0.24em] text-slate-500">Solved Today</p>
                  <p className={`mt-2 text-sm font-bold ${challengeState.solvedToday ? "text-emerald-400" : "text-amber-400"}`}>
                    {challengeState.solvedToday ? "Completed" : "Pending"}
                  </p>
                </div>
                <div className="rounded-2xl border border-white/10 bg-slate-950/50 p-4">
                  <p className="text-[10px] font-black uppercase tracking-[0.24em] text-slate-500">Last Solve</p>
                  <p className="mt-2 text-sm font-bold text-white">{challengeState.lastSolvedOn || "Not yet solved"}</p>
                </div>
              </div>
            </div>
          </section>

          <aside className="space-y-6 xl:col-span-5 xl:sticky xl:top-24 self-start">
            <div className="rounded-[28px] border border-white/10 bg-slate-900/70 p-7 shadow-[0_24px_70px_rgba(2,6,23,0.5)]">
              <div className="mb-6 flex items-center gap-3">
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[var(--accent-secondary)] text-[var(--accent-primary)]">
                  <Icon.Edit className="h-6 w-6" />
                </div>
                <div>
                  <p className="text-[11px] font-black uppercase tracking-[0.28em] text-[var(--accent-primary)]">Profile Details</p>
                  <h2 className="mt-1 text-xl font-black text-white">Update the essentials</h2>
                </div>
              </div>

              <div className="space-y-5">
                <div>
                  <label className="mb-2 block text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">Display name</label>
                  <div className="flex flex-col gap-3 sm:flex-row">
                    <input
                      type="text"
                      value={displayName}
                      onChange={(event) => setDisplayName(event.target.value)}
                      className="min-w-0 flex-1 rounded-2xl border border-white/10 bg-slate-950/70 px-4 py-3 text-sm text-white outline-none transition-colors focus:border-[var(--accent-primary)]"
                      placeholder="Enter your name..."
                    />
                    <button
                      type="button"
                      onClick={updateProfile}
                      disabled={loading}
                      className="rounded-2xl bg-[var(--accent-primary)] px-5 py-3 text-sm font-semibold text-slate-950 transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60"
                    >
                      {loading ? "Saving..." : "Save"}
                    </button>
                  </div>
                </div>

                <div>
                  <label className="mb-2 block text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">Email</label>
                  <div className="rounded-2xl border border-white/10 bg-slate-950/50 px-4 py-3 text-sm text-slate-400">
                    {user?.email}
                  </div>
                </div>
              </div>
            </div>

            <div className="rounded-[28px] border border-white/10 bg-slate-900/70 p-7 shadow-[0_24px_70px_rgba(2,6,23,0.5)]">
              <div className="mb-6 flex items-center gap-3">
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[var(--accent-secondary)] text-[var(--accent-primary)]">
                  <Icon.Shield className="h-6 w-6" />
                </div>
                <div>
                  <p className="text-[11px] font-black uppercase tracking-[0.28em] text-[var(--accent-primary)]">Quick Summary</p>
                  <h2 className="mt-1 text-xl font-black text-white">Only the useful profile info</h2>
                </div>
              </div>

              <div className="space-y-4">
                {[
                  { label: "Learner Name", value: userName },
                  { label: "Readiness Score", value: `${readiness}%` },
                  { label: "Strongest Skill", value: strongestSkill[0] },
                  { label: "Needs Attention", value: weakestSkill[0] }
                ].map((item) => (
                  <div key={item.label} className="rounded-2xl border border-white/10 bg-slate-950/50 p-4">
                    <p className="text-[10px] font-black uppercase tracking-[0.24em] text-slate-500">{item.label}</p>
                    <p className="mt-2 text-sm font-semibold text-white">{item.value}</p>
                  </div>
                ))}
              </div>
            </div>

            <div className="rounded-[28px] border border-white/10 bg-slate-900/70 p-7 shadow-[0_24px_70px_rgba(2,6,23,0.5)]">
              <div className="mb-6 flex items-center gap-3">
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[var(--accent-secondary)] text-[var(--accent-primary)]">
                  <Icon.Zap className="h-6 w-6" />
                </div>
                <div>
                  <p className="text-[11px] font-black uppercase tracking-[0.28em] text-[var(--accent-primary)]">Quick Actions</p>
                  <h2 className="mt-1 text-xl font-black text-white">Jump back into learning</h2>
                </div>
              </div>

              <div className="grid gap-3 sm:grid-cols-2">
                <button type="button" onClick={() => navigate("/daily-challenge")} className="rounded-2xl bg-[var(--accent-primary)] px-4 py-3 text-sm font-semibold text-slate-950 transition-opacity hover:opacity-90">
                  Open Daily Challenge
                </button>
                <button type="button" onClick={() => navigate("/dashboard")} className="rounded-2xl bg-white/10 px-4 py-3 text-sm font-semibold text-white transition-colors hover:bg-white/15">
                  Go to Dashboard
                </button>
                <button type="button" onClick={() => navigate("/settings")} className="rounded-2xl bg-slate-950/70 px-4 py-3 text-sm font-semibold text-slate-300 transition-colors hover:bg-slate-800 sm:col-span-2">
                  Open Settings
                </button>
              </div>
            </div>

            <div className="rounded-[28px] border border-white/10 bg-slate-900/70 p-7 shadow-[0_24px_70px_rgba(2,6,23,0.5)]">
              <div className="mb-6 flex items-center gap-3">
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[var(--accent-secondary)] text-[var(--accent-primary)]">
                  <Icon.CheckCircle className="h-6 w-6" />
                </div>
                <div>
                  <p className="text-[11px] font-black uppercase tracking-[0.28em] text-[var(--accent-primary)]">Recent Milestones</p>
                  <h2 className="mt-1 text-xl font-black text-white">Latest learning wins</h2>
                </div>
              </div>

              <div className="space-y-4">
                {recentMilestones.length > 0 ? recentMilestones.map((item) => (
                  <div key={`${item.title}-${item.time}`} className="rounded-2xl border border-white/10 bg-slate-950/50 p-4">
                    <div className="flex items-start gap-3">
                      <div className={`text-lg ${item.color}`}>{item.icon}</div>
                      <div>
                        <p className="text-sm font-semibold text-white">{item.title}</p>
                        <p className="mt-1 text-xs uppercase tracking-[0.22em] text-slate-500">{item.time}</p>
                      </div>
                    </div>
                  </div>
                )) : (
                  <div className="rounded-2xl border border-white/10 bg-slate-950/50 p-4 text-sm text-slate-400">
                    Complete an assessment or daily challenge to start building your milestone history.
                  </div>
                )}
              </div>
            </div>

            <div className="rounded-[28px] border border-rose-500/20 bg-rose-500/5 p-7 shadow-[0_24px_70px_rgba(2,6,23,0.4)]">
              <div className="flex items-start gap-4">
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-rose-500/10 text-rose-400">
                  <Icon.LogOut className="h-6 w-6" />
                </div>
                <div className="flex-1">
                  <p className="text-[11px] font-black uppercase tracking-[0.28em] text-rose-400">Session Control</p>
                  <h2 className="mt-2 text-xl font-black text-white">Sign out safely</h2>
                  <p className="mt-2 text-sm leading-7 text-slate-400">Leave the workspace without carrying the extra placeholder settings that used to clutter this page.</p>
                  <button
                    type="button"
                    onClick={handleSignOut}
                    className="mt-5 rounded-2xl bg-rose-500/15 px-5 py-3 text-sm font-semibold text-rose-300 transition-colors hover:bg-rose-500/20"
                  >
                    Sign Out
                  </button>
                </div>
              </div>
            </div>
          </aside>
        </div>
      </main>
    </div>
  );
};

export default Profile;
