"use client";
import { useState, useEffect, useCallback } from "react";

type Task = { id: number; text: string; done: boolean; priority: "high" | "medium" | "low" };
type Goal = { label: string; done: boolean; target: string };
type CalEvent = { id: string; title: string; start: string; end: string; allDay: boolean };
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
  const [calEvents, setCalEvents] = useState<CalEvent[]>([]);
  const [calLoading, setCalLoading] = useState(false);

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
    fetchCalendar();
  }, []);

  const fetchCalendar = async () => {
    setCalLoading(true);
    try {
      const res = await fetch("/api/calendar");
      const data = await res.json();
      if (data.events) setCalEvents(data.events);
    } catch { /* silent */ } finally {
      setCalLoading(false);
    }
  };

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

      {/* Greeting + mini widgets */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-3xl font-semibold tracking-tight text-white">{greeting}, Alexandra.</h1>
          <p className="text-white/35 mt-1 text-sm">Here's what's on today.</p>
        </div>
        <div className="hidden md:flex gap-3 shrink-0">
          <CalendarWidget />
          <WeatherWidget />
        </div>
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

        {/* Upcoming Events */}
        <div className="card p-5 md:col-span-2">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-white font-semibold text-sm">Upcoming</h2>
            <button onClick={fetchCalendar} className="text-xs text-white/25 hover:text-white transition-colors">↻ Refresh</button>
          </div>
          {calLoading ? (
            <p className="text-white/25 text-sm text-center py-6">Loading events…</p>
          ) : calEvents.length === 0 ? (
            <div className="text-center py-8 border border-dashed border-white/8 rounded-xl">
              <p className="text-white/25 text-sm">No upcoming events in the next 30 days.</p>
            </div>
          ) : (
            <div className="space-y-2">
              {calEvents.map((ev) => {
                const start = new Date(ev.start);
                const isToday = start.toDateString() === new Date().toDateString();
                const isTomorrow = start.toDateString() === new Date(Date.now() + 86400000).toDateString();
                const dateLabel = isToday ? "Today" : isTomorrow ? "Tomorrow" : start.toLocaleDateString("en-GB", { weekday: "short", day: "numeric", month: "short" });
                const timeLabel = ev.allDay ? "All day" : start.toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" });
                return (
                  <div key={ev.id} className="flex items-center gap-4 py-2.5 border-b border-white/5 last:border-0">
                    <div className="w-1.5 h-1.5 rounded-full bg-green-400 shrink-0" />
                    <div className="flex-1 min-w-0">
                      <p className="text-white/80 text-sm font-medium truncate">{ev.title}</p>
                      <p className="text-white/35 text-xs">{timeLabel}</p>
                    </div>
                    <span className={`text-xs shrink-0 ${ isToday ? "text-green-400" : "text-white/35" }`}>{dateLabel}</span>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Calendar + Weather — mobile only (shown above on desktop) */}
        <div className="grid grid-cols-2 gap-4 md:col-span-2 md:hidden">
          <CalendarWidget />
          <WeatherWidget />
        </div>

      </div>
    </div>
  );
}

// ── Calendar Widget ─────────────────────────────────────────────────────────
function CalendarWidget() {
  const today = new Date();
  const year = today.getFullYear();
  const month = today.getMonth();
  const monthName = today.toLocaleString("en-GB", { month: "long" }).toUpperCase();

  // Days in month
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  // What weekday does the 1st fall on? (0=Sun…6=Sat → convert to Mon-start: Mon=0)
  const firstDow = new Date(year, month, 1).getDay(); // 0=Sun
  const offset = (firstDow + 6) % 7; // Mon-start offset

  const cells: (number | null)[] = [
    ...Array(offset).fill(null),
    ...Array.from({ length: daysInMonth }, (_, i) => i + 1),
  ];
  // Pad to complete last row
  while (cells.length % 7 !== 0) cells.push(null);

  return (
    <div className="card p-3" style={{ width: 160, minWidth: 160 }}>
      {/* Header */}
      <div className="flex items-center justify-between mb-1.5">
        <span className="text-red-400 font-semibold text-[11px] tracking-widest">{monthName}</span>
        <span className="text-white/25 text-[10px]">{year}</span>
      </div>

      {/* Day headers */}
      <div className="grid grid-cols-7 mb-0.5">
        {["M","T","W","T","F","S","S"].map((d, i) => (
          <div key={i} className="text-center text-[9px] text-white/25 font-medium py-0.5">{d}</div>
        ))}
      </div>

      {/* Date grid */}
      <div className="grid grid-cols-7">
        {cells.map((day, i) => {
          const isToday = day === today.getDate();
          return (
            <div key={i} className="flex items-center justify-center" style={{ height: 18 }}>
              {day ? (
                <span className={`text-[10px] w-5 h-5 flex items-center justify-center rounded-full font-medium
                  ${ isToday
                      ? "bg-red-500 text-white font-bold"
                      : "text-white/55"
                  }`}>
                  {day}
                </span>
              ) : null}
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ── Weather Widget ────────────────────────────────────────────────────────────
type WeatherData = {
  temp: number;
  condition: string;
  precipBars: number[]; // 0-1 values for next 12 hours
  location: string;
};

function getConditionText(code: number, precipProb: number): string {
  if (precipProb >= 60) return "Expect rain in the next hour";
  if (precipProb >= 30) return "Possible light rain ahead";
  if (code === 0) return "Clear skies right now";
  if (code <= 3) return "Partly cloudy today";
  if (code <= 48) return "Foggy or overcast";
  if (code <= 67) return "Rainy conditions";
  if (code <= 77) return "Snow possible";
  if (code <= 82) return "Showers expected";
  return "Stormy conditions";
}

export function WeatherWidget() {
  const [weather, setWeather] = useState<WeatherData | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchWeather = useCallback(async () => {
    try {
      // Wandsworth, London
      const lat = 51.4613, lon = -0.1878;
      const url = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}` +
        `&current=temperature_2m,weather_code` +
        `&hourly=precipitation_probability,precipitation` +
        `&forecast_days=1&timezone=Europe%2FLondon`;
      const res = await fetch(url);
      const data = await res.json();

      const now = new Date();
      const currentHour = now.getHours();
      const precipProbs: number[] = data.hourly.precipitation_probability.slice(currentHour, currentHour + 12);
      const precipAmts: number[] = data.hourly.precipitation.slice(currentHour, currentHour + 12);
      const maxAmt = Math.max(...precipAmts, 0.5);
      const precipBars = precipAmts.map(v => v / maxAmt);

      setWeather({
        temp: Math.round(data.current.temperature_2m),
        condition: getConditionText(data.current.weather_code, precipProbs[0] ?? 0),
        precipBars,
        location: "Wandsworth",
      });
    } catch {
      // silently fail
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchWeather(); }, [fetchWeather]);

  return (
    <div
      className="rounded-2xl p-3 flex flex-col justify-between"
      style={{
        width: 160, minWidth: 160, height: 160,
        background: "linear-gradient(160deg, #1a6eb5 0%, #1255a0 60%, #0d4080 100%)"
      }}
    >
      {loading ? (
        <div className="flex-1 flex items-center justify-center">
          <p className="text-white/40 text-xs">Loading…</p>
        </div>
      ) : weather ? (
        <>
          {/* Location + temp */}
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-1">
              <span className="text-white/60 text-[10px]">📍</span>
              <span className="text-white/80 text-[11px] font-medium">{weather.location}</span>
            </div>
            <span className="text-white text-xl font-light leading-none">{weather.temp}°</span>
          </div>

          {/* Condition */}
          <p className="text-white font-semibold text-[11px] leading-tight mt-1">
            {weather.condition}
          </p>

          {/* Precipitation bars */}
          <div className="mt-auto pt-2">
            <div className="flex items-end gap-px h-6">
              {weather.precipBars.map((v, i) => (
                <div
                  key={i}
                  className="flex-1 rounded-sm bg-white/30"
                  style={{ height: `${Math.max(8, v * 100)}%`, opacity: 0.35 + v * 0.65 }}
                />
              ))}
            </div>
            <div className="flex justify-between mt-0.5">
              <span className="text-white/40 text-[9px]">Now</span>
              <span className="text-white/40 text-[9px]">+12h</span>
            </div>
          </div>
        </>
      ) : (
        <div className="flex-1 flex items-center justify-center">
          <p className="text-white/40 text-xs">Unavailable</p>
        </div>
      )}
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
