"use client";
import { useState, useEffect } from "react";

type Task = { id: number; text: string; done: boolean; priority: "high" | "medium" | "low" };
type Goal = { label: string; done: boolean; target: string };
type Digest = { id: string; title: string; source: string; summary: string; addedAt: string; read: boolean };
type EmailItem = { uid: number; fromName: string; subject: string; date: string; priority: "urgent" | "reply" | "fyi" | "ignore"; summary: string };

const priorityConfig = {
  urgent: { label: "Urgent", color: "text-red-400",    bg: "bg-red-400/10 border-red-400/20" },
  reply:  { label: "Reply",  color: "text-yellow-400", bg: "bg-yellow-400/10 border-yellow-400/20" },
  fyi:    { label: "FYI",    color: "text-blue-400",   bg: "bg-blue-400/10 border-blue-400/20" },
  ignore: { label: "Skip",   color: "text-white/20",   bg: "bg-white/5 border-white/8" },
};
type CreditScore = { score: number; provider: string; updatedAt: string };

function getCreditBand(score: number) {
  if (score >= 961) return { label: "Excellent", color: "text-green-400" };
  if (score >= 881) return { label: "Good",      color: "text-green-400" };
  if (score >= 721) return { label: "Fair",       color: "text-yellow-400" };
  if (score >= 561) return { label: "Poor",       color: "text-orange-400" };
  return                   { label: "Very Poor",  color: "text-red-400" };
}

interface HomeProps {
  setActive?: (tab: string) => void;
}

export default function Home({ setActive }: HomeProps) {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [goals, setGoals] = useState<Goal[]>([]);
  const [digests, setDigests] = useState<Digest[]>([]);
  const [creditScore, setCreditScore] = useState<CreditScore | null>(null);
  const [emails, setEmails] = useState<EmailItem[]>([]);
  const [emailLoading, setEmailLoading] = useState(false);
  const [emailError, setEmailError] = useState("");

  useEffect(() => {
    const savedTasks = localStorage.getItem("dashboard-tasks");
    if (savedTasks) {
      try {
        const all = JSON.parse(savedTasks) as Task[];
        setTasks(all.filter((t) => !t.done && t.priority === "high").slice(0, 5));
      } catch {}
    }
    const savedGoals = localStorage.getItem("dashboard-goals");
    if (savedGoals) {
      try { setGoals(JSON.parse(savedGoals)); } catch {}
    }
    const savedDigests = localStorage.getItem("dashboard-digests");
    if (savedDigests) {
      try { setDigests(JSON.parse(savedDigests)); } catch {}
    }
    const savedCredit = localStorage.getItem("dashboard-credit-score");
    if (savedCredit) {
      try { setCreditScore(JSON.parse(savedCredit)); } catch {}
    }
    fetchEmails();
  }, []);

  const fetchEmails = async () => {
    setEmailLoading(true);
    setEmailError("");
    try {
      const res = await fetch("/api/email");
      const data = await res.json();
      if (data.emails) setEmails(data.emails.filter((e: EmailItem) => e.priority !== "ignore").slice(0, 6));
      else setEmailError("Could not load emails.");
    } catch {
      setEmailError("Could not load emails.");
    } finally {
      setEmailLoading(false);
    }
  };

  const goalsCompleted = goals.filter((g) => g.done).length;
  const goalsTotal = goals.length;
  const goalsPercent = goalsTotal > 0 ? Math.round((goalsCompleted / goalsTotal) * 100) : 0;

  const hour = new Date().getHours();
  const greeting = hour < 12 ? "Good morning" : hour < 18 ? "Good afternoon" : "Good evening";

  return (
    <div className="space-y-6">

      {/* Greeting */}
      <div>
        <h1 className="text-3xl font-semibold tracking-tight text-white">{greeting}, Alexandra.</h1>
        <p className="text-white/35 mt-1 text-sm">Here's what's on today.</p>
      </div>

      {/* Top stats row */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
        <StatCard
          label="Available Balance"
          value="—"
          sub="Connect banks to see"
          onClick={() => setActive?.("Finance")}
        />
        <StatCard
          label="Goals Progress"
          value={goalsTotal > 0 ? `${goalsCompleted} / ${goalsTotal}` : "—"}
          sub={goalsTotal > 0 ? `${goalsPercent}% complete` : "No goals yet"}
          progress={goalsPercent}
          onClick={() => setActive?.("Goals")}
        />
        <StatCard
          label="Urgent Tasks"
          value={tasks.length > 0 ? `${tasks.length}` : "All clear"}
          sub={tasks.length > 0 ? "high priority" : "Nothing urgent"}
          alert={tasks.length > 0}
          onClick={() => setActive?.("Tasks")}
        />
        <StatCard
          label="AI Digests"
          value={digests.length > 0 ? `${digests.filter(d => !d.read).length}` : "—"}
          sub={digests.length > 0 ? "unread updates" : "Nothing yet"}
          onClick={() => setActive?.("Email")}
        />
        {(() => {
          const band = creditScore ? getCreditBand(creditScore.score) : null;
          return (
            <StatCard
              label="Credit Score"
              value={creditScore ? `${creditScore.score}` : "—"}
              sub={band ? `${band.label} · ${creditScore!.provider}` : "Not set yet"}
              customValueColor={band?.color}
              onClick={() => setActive?.("Finance")}
            />
          );
        })()}
      </div>

      {/* Main grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">

        {/* Priority Tasks */}
        <div className="card p-5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-white font-semibold text-sm">Priority Tasks</h2>
            {tasks.length > 0 && (
              <span className="text-xs text-red-400 bg-red-400/10 border border-red-400/20 px-2 py-0.5 rounded-full">
                {tasks.length} urgent
              </span>
            )}
          </div>
          {tasks.length === 0 ? (
            <p className="text-white/25 text-sm py-4 text-center">No urgent tasks. Nice.</p>
          ) : (
            <div className="space-y-2">
              {tasks.map((t) => (
                <div key={t.id} className="flex items-start gap-3 py-2 border-b border-white/5 last:border-0">
                  <div className="w-1.5 h-1.5 rounded-full bg-red-400 mt-1.5 shrink-0" />
                  <span className="text-white/75 text-sm">{t.text}</span>
                </div>
              ))}
            </div>
          )}
          <button
            onClick={() => setActive?.("Tasks")}
            className="text-xs text-green-400 hover:text-green-300 mt-4 transition-colors"
          >
            View all tasks →
          </button>
        </div>

        {/* Goals */}
        <div className="card p-5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-white font-semibold text-sm">2026 Goals</h2>
            <span className="stat-label">{goalsPercent}%</span>
          </div>
          {goalsTotal === 0 ? (
            <p className="text-white/25 text-sm py-4 text-center">No goals set yet.</p>
          ) : (
            <>
              <div className="progress-track h-1.5 mb-4">
                <div className="progress-fill h-1.5" style={{ width: `${goalsPercent}%` }} />
              </div>
              <div className="space-y-2">
                {goals.slice(0, 5).map((g, i) => (
                  <div key={i} className="flex items-center gap-3">
                    <div className={`w-4 h-4 rounded-full border flex items-center justify-center shrink-0 ${
                      g.done ? "bg-green-500/20 border-green-500/40" : "border-white/15"
                    }`}>
                      {g.done && <span className="text-green-400 text-[9px]">✓</span>}
                    </div>
                    <span className={`text-sm ${g.done ? "text-white/30 line-through" : "text-white/70"}`}>{g.label}</span>
                  </div>
                ))}
              </div>
            </>
          )}
          <button
            onClick={() => setActive?.("Goals")}
            className="text-xs text-green-400 hover:text-green-300 mt-4 transition-colors"
          >
            View all goals →
          </button>
        </div>

        {/* AI Digests */}
        <div className="card p-5 md:col-span-2">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-white font-semibold text-sm">AI Digests</h2>
            <span className="stat-label">Creator updates &amp; insights</span>
          </div>
          {digests.length === 0 ? (
            <div className="text-center py-8 border border-dashed border-white/8 rounded-xl">
              <p className="text-white/25 text-sm">No digests yet.</p>
              <p className="text-white/15 text-xs mt-1">Fred will post updates from creators you follow here.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {digests.map((d) => (
                <div key={d.id} className={`border border-white/8 rounded-xl p-4 ${d.read ? "opacity-40" : ""}`}>
                  <div className="flex items-start justify-between mb-1.5">
                    <span className="text-white/80 text-sm font-medium">{d.title}</span>
                    {!d.read && <div className="w-1.5 h-1.5 rounded-full bg-green-400 mt-1 shrink-0" />}
                  </div>
                  <p className="text-white/35 text-xs mb-2">{d.source}</p>
                  <p className="text-white/55 text-sm">{d.summary}</p>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Email preview */}
        <div className="card p-5 md:col-span-2">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-white font-semibold text-sm">Recent Emails</h2>
            <div className="flex gap-3 items-center">
              {!emailLoading && (
                <button onClick={fetchEmails} className="text-xs text-white/25 hover:text-white transition-colors">↻ Refresh</button>
              )}
              <button onClick={() => setActive?.("Email")} className="text-xs text-green-400 hover:text-green-300 transition-colors">View all →</button>
            </div>
          </div>

          {emailLoading && (
            <div className="text-center py-8">
              <p className="text-white/25 text-sm">Loading emails…</p>
            </div>
          )}

          {emailError && !emailLoading && (
            <div className="text-center py-6 border border-dashed border-white/8 rounded-xl">
              <p className="text-white/25 text-sm">{emailError}</p>
              <button onClick={fetchEmails} className="text-xs text-green-400 mt-2 hover:text-green-300">Try again</button>
            </div>
          )}

          {!emailLoading && !emailError && emails.length === 0 && (
            <div className="text-center py-8 border border-dashed border-white/8 rounded-xl">
              <p className="text-white/25 text-sm">No emails to show.</p>
            </div>
          )}

          {!emailLoading && emails.length > 0 && (
            <div className="space-y-2">
              {emails.map((email) => {
                const p = priorityConfig[email.priority];
                return (
                  <div key={email.uid} className="flex items-start gap-3 py-2.5 border-b border-white/5 last:border-0">
                    <span className={`text-[10px] font-semibold px-1.5 py-0.5 rounded border shrink-0 mt-0.5 ${p.bg} ${p.color}`}>
                      {p.label}
                    </span>
                    <div className="flex-1 min-w-0">
                      <p className="text-white/80 text-sm font-medium truncate">{email.subject}</p>
                      <p className="text-white/35 text-xs truncate">{email.fromName} · {email.summary}</p>
                    </div>
                    <p className="text-white/20 text-xs shrink-0">
                      {new Date(email.date).toLocaleDateString("en-GB", { day: "numeric", month: "short" })}
                    </p>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Calendar placeholder */}
        <div className="card p-5 md:col-span-2">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-white font-semibold text-sm">Upcoming</h2>
            <span className="stat-label">Calendar</span>
          </div>
          <div className="text-center py-8 border border-dashed border-white/8 rounded-xl">
            <p className="text-white/25 text-sm">Calendar integration coming soon.</p>
          </div>
        </div>

      </div>
    </div>
  );
}

function StatCard({
  label, value, sub, progress, alert, onClick, customValueColor
}: {
  label: string; value: string; sub: string;
  progress?: number; alert?: boolean; onClick?: () => void; customValueColor?: string;
}) {
  return (
    <button onClick={onClick} className="card p-4 text-left w-full hover:border-white/14 transition-colors">
      <p className="stat-label mb-2">{label}</p>
      <p className={`text-2xl font-semibold tracking-tight ${customValueColor ?? (alert ? "text-red-400" : "text-white")}`}>{value}</p>
      {progress !== undefined && (
        <div className="progress-track h-1 mt-2 mb-1">
          <div className="progress-fill h-1" style={{ width: `${progress}%` }} />
        </div>
      )}
      <p className="text-white/25 text-xs mt-1">{sub}</p>
    </button>
  );
}
