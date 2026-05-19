"use client";
import { useState, useEffect } from "react";

type Task = { id: number; text: string; done: boolean; priority: "high" | "medium" | "low" };
type Goal = { label: string; done: boolean; target: string };
type Digest = {
  id: string;
  title: string;
  source: string;
  summary: string;
  addedAt: string;
  read: boolean;
};

export default function Home() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [goals, setGoals] = useState<Goal[]>([]);
  const [digests, setDigests] = useState<Digest[]>([]);

  // Load data from localStorage
  useEffect(() => {
    // Load tasks
    const savedTasks = localStorage.getItem("dashboard-tasks");
    if (savedTasks) {
      try {
        const allTasks = JSON.parse(savedTasks) as Task[];
        // Only show high priority, not done
        const priorityTasks = allTasks.filter((t) => !t.done && t.priority === "high").slice(0, 3);
        setTasks(priorityTasks);
      } catch (e) {
        console.error("Failed to parse tasks", e);
      }
    }

    // Load goals
    const savedGoals = localStorage.getItem("dashboard-goals");
    if (savedGoals) {
      try {
        const allGoals = JSON.parse(savedGoals) as Goal[];
        setGoals(allGoals);
      } catch (e) {
        console.error("Failed to parse goals", e);
      }
    }

    // Load digests (placeholder for now)
    const savedDigests = localStorage.getItem("dashboard-digests");
    if (savedDigests) {
      try {
        setDigests(JSON.parse(savedDigests));
      } catch (e) {
        console.error("Failed to parse digests", e);
      }
    }
  }, []);

  const goalsCompleted = goals.filter((g) => g.done).length;
  const goalsTotal = goals.length;
  const goalsPercent = goalsTotal > 0 ? Math.round((goalsCompleted / goalsTotal) * 100) : 0;

  const now = new Date();
  const greeting = now.getHours() < 12 ? "Good morning" : now.getHours() < 18 ? "Good afternoon" : "Good evening";

  return (
    <div className="space-y-4">
      
      {/* Welcome header */}
      <div className="glass p-6">
        <h2 className="text-2xl font-semibold text-white mb-1">{greeting}, Alex</h2>
        <p className="text-white/40 text-sm">Here's what needs your attention today.</p>
      </div>

      {/* Quick stats grid */}
      <div className="grid grid-cols-2 gap-4">
        
        {/* Total Balance */}
        <div className="glass p-5">
          <div className="text-white/40 text-xs uppercase tracking-wide mb-1">Available Balance</div>
          <div className="text-2xl font-semibold text-green-400">—</div>
          <div className="text-white/30 text-xs mt-1">Connect banks to see total</div>
        </div>

        {/* Goals Progress */}
        <div className="glass p-5">
          <div className="text-white/40 text-xs uppercase tracking-wide mb-1">2026 Goals</div>
          <div className="text-2xl font-semibold text-white">
            {goalsCompleted}/{goalsTotal}
          </div>
          <div className="w-full bg-white/5 rounded-full h-1.5 mt-2">
            <div className="bg-green-400 h-1.5 rounded-full transition-all" style={{ width: `${goalsPercent || 2}%` }} />
          </div>
        </div>

      </div>

      {/* Priority Tasks */}
      {tasks.length > 0 && (
        <div className="glass p-5">
          <h3 className="text-white font-semibold text-sm uppercase tracking-wide mb-3 flex items-center justify-between">
            <span>High Priority Tasks</span>
            <span className="text-red-400 text-xs">{tasks.length} urgent</span>
          </h3>
          <div className="space-y-2">
            {tasks.map((t) => (
              <div key={t.id} className="flex items-center gap-3 text-sm text-white/70">
                <div className="w-2 h-2 rounded-full bg-red-400 flex-shrink-0" />
                <span>{t.text}</span>
              </div>
            ))}
          </div>
          <a 
            href="#" 
            onClick={(e) => { e.preventDefault(); (window as any).setActiveTab?.("Tasks"); }}
            className="text-xs text-green-400 hover:text-green-300 mt-3 inline-block"
          >
            View all tasks →
          </a>
        </div>
      )}

      {tasks.length === 0 && (
        <div className="glass p-5">
          <h3 className="text-white font-semibold text-sm uppercase tracking-wide mb-2">High Priority Tasks</h3>
          <p className="text-white/30 text-sm">All clear! No urgent tasks right now.</p>
        </div>
      )}

      {/* AI Digests */}
      <div className="glass p-5">
        <h3 className="text-white font-semibold text-sm uppercase tracking-wide mb-1">AI Digests</h3>
        <p className="text-white/30 text-xs mb-4">Updates from creators you follow, news summaries, and insights.</p>
        
        {digests.length === 0 ? (
          <div className="text-center py-6">
            <p className="text-white/30 text-sm mb-2">No digests yet.</p>
            <p className="text-white/20 text-xs">Fred will monitor your favorite creators and post updates here.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {digests.map((d) => (
              <div key={d.id} className={`border border-white/10 rounded-lg p-3 ${d.read ? 'opacity-50' : ''}`}>
                <div className="flex items-start justify-between mb-1">
                  <div className="text-white/80 text-sm font-medium">{d.title}</div>
                  {!d.read && <div className="w-2 h-2 rounded-full bg-green-400 flex-shrink-0 mt-1" />}
                </div>
                <div className="text-white/40 text-xs mb-2">{d.source}</div>
                <p className="text-white/60 text-sm">{d.summary}</p>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Calendar placeholder */}
      <div className="glass p-5">
        <h3 className="text-white font-semibold text-sm uppercase tracking-wide mb-2">Upcoming</h3>
        <div className="text-center py-4">
          <p className="text-white/30 text-sm">Calendar integration coming soon.</p>
        </div>
      </div>

    </div>
  );
}
