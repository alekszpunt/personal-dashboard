"use client";
import { useState } from "react";
import { loadGoals, saveGoals, type SmartGoal } from "../lib/smartGoals";

const categoryIcons: Record<string, string> = {
  learning: "▶",
  finance: "₤",
  health: "♡",
  goals: "◎",
  tasks: "✓",
};

const categoryColors: Record<string, string> = {
  learning: "text-purple-400",
  finance: "text-green-400",
  health: "text-pink-400",
  goals: "text-blue-400",
  tasks: "text-yellow-400",
};

export default function SmartGoalIntake() {
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [result, setResult] = useState<SmartGoal | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!input.trim()) return;

    setLoading(true);
    setError("");
    setResult(null);

    try {
      const res = await fetch("/api/goals/intake", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ input: input.trim() }),
      });

      if (!res.ok) {
        const err = await res.json() as { error?: string };
        throw new Error(err.error || `HTTP ${res.status}`);
      }

      const data = await res.json() as Omit<SmartGoal, "id" | "input" | "createdAt">;

      const goal: SmartGoal = {
        ...data,
        id: Date.now().toString(),
        input: input.trim(),
        createdAt: new Date().toISOString(),
      };

      const existing = loadGoals();
      saveGoals([goal, ...existing]);
      setResult(goal);
      setInput("");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="card p-5">
      <div className="flex items-center gap-2 mb-4">
        <span className="text-green-400 text-base">◎</span>
        <h2 className="text-white font-semibold text-sm">Smart Goals</h2>
        <span className="stat-label ml-auto">AI-powered planning</span>
      </div>

      <form onSubmit={handleSubmit} className="flex gap-2">
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="What do you want to achieve?"
          disabled={loading}
          className="field flex-1 text-sm"
        />
        <button
          type="submit"
          disabled={loading || !input.trim()}
          className="btn-primary text-sm px-4 shrink-0 disabled:opacity-40 disabled:cursor-not-allowed"
        >
          {loading ? "Thinking…" : "Add goal"}
        </button>
      </form>

      {error && (
        <p className="text-red-400 text-xs mt-3">Error: {error}</p>
      )}

      {result && (
        <div className="mt-4 border border-white/10 rounded-xl p-4 bg-white/3">
          <div className="flex items-center gap-2 mb-2">
            <span className={`text-lg ${categoryColors[result.category] ?? "text-white/60"}`}>
              {categoryIcons[result.category] ?? "◎"}
            </span>
            <span className="text-white font-semibold text-sm">{result.title}</span>
            <span className="ml-auto text-[10px] text-white/30 bg-white/5 border border-white/10 px-2 py-0.5 rounded-full capitalize">
              {result.category}
            </span>
          </div>
          <p className="text-white/50 text-xs mb-3">{result.summary}</p>
          {result.simple ? (
            <p className="text-green-400/60 text-xs">✓ Added as a quick task</p>
          ) : (
            <div className="space-y-1.5">
              {result.plan.slice(0, 2).map((step, i) => (
                <div key={i} className="flex items-start gap-2">
                  <span className="text-green-400 text-[10px] mt-0.5 shrink-0">›</span>
                  <div className="flex-1 min-w-0">
                    <span className="text-white/70 text-xs">{step.step}</span>
                    <span className="text-white/25 text-[10px] ml-2">{step.timeframe}</span>
                  </div>
                </div>
              ))}
              {result.plan.length > 2 && (
                <p className="text-white/25 text-[10px] pl-4">+{result.plan.length - 2} more steps — view in Goals</p>
              )}
            </div>
          )}
          {result.tags.length > 0 && (
            <div className="flex gap-1.5 mt-3 flex-wrap">
              {result.tags.map((tag) => (
                <span key={tag} className="text-[10px] text-white/30 bg-white/5 border border-white/8 px-2 py-0.5 rounded-full">
                  #{tag}
                </span>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
