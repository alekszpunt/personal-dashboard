"use client";
import { useState, useEffect } from "react";
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

const categoryBg: Record<string, string> = {
  learning: "bg-purple-400/10 border-purple-400/20",
  finance: "bg-green-400/10 border-green-400/20",
  health: "bg-pink-400/10 border-pink-400/20",
  goals: "bg-blue-400/10 border-blue-400/20",
  tasks: "bg-yellow-400/10 border-yellow-400/20",
};

const categoryLabels: Record<string, string> = {
  learning: "Learning Goals",
  finance: "Finance Goals",
  health: "Health Goals",
  goals: "Life Goals",
  tasks: "Tasks & Projects",
};

const allCategories = ["goals", "learning", "finance", "health", "tasks"] as const;

function FinanceProjection({ goal }: { goal: SmartGoal["financeGoal"] }) {
  if (!goal) return null;
  const yearly = goal.monthlyAmount * 12;
  const fiveYear = goal.monthlyAmount * 60;
  return (
    <div className="mt-2 p-2 rounded-lg bg-green-400/5 border border-green-400/15">
      <p className="text-green-400 text-xs font-medium">
        £{goal.monthlyAmount.toLocaleString()}/mo · £{yearly.toLocaleString()}/yr · £{fiveYear.toLocaleString()} in 5 years
      </p>
      {goal.targetTotal && (
        <p className="text-white/35 text-[11px] mt-0.5">
          Target: £{goal.targetTotal.toLocaleString()}
          {goal.timeframeMonths ? ` over ${goal.timeframeMonths} months` : ""}
        </p>
      )}
      <p className="text-white/30 text-[11px] mt-0.5">{goal.purpose}</p>
    </div>
  );
}

function GoalCard({ goal, onUpdate, onDelete }: {
  goal: SmartGoal;
  onUpdate: (updated: SmartGoal) => void;
  onDelete: (id: string) => void;
}) {
  const [expanded, setExpanded] = useState(false);

  const doneCount = goal.plan.filter((s) => s.done).length;
  const totalCount = goal.plan.length;
  const progress = totalCount > 0 ? Math.round((doneCount / totalCount) * 100) : 0;

  function toggleStep(idx: number) {
    const newPlan = goal.plan.map((s, i) =>
      i === idx ? { ...s, done: !s.done } : s
    );
    onUpdate({ ...goal, plan: newPlan });
  }

  return (
    <div className="border border-white/8 rounded-xl p-4 bg-white/2">
      {/* Header row */}
      <div className="flex items-start gap-3">
        <span className={`text-base shrink-0 ${categoryColors[goal.category] ?? "text-white/50"}`}>
          {categoryIcons[goal.category] ?? "◎"}
        </span>
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2">
            <h3 className="text-white font-semibold text-sm leading-tight">{goal.title}</h3>
            <button
              onClick={() => onDelete(goal.id)}
              className="text-white/15 hover:text-red-400 text-xs transition-colors shrink-0"
              title="Delete goal"
            >
              ✕
            </button>
          </div>
          <p className="text-white/45 text-xs mt-0.5">{goal.summary}</p>
        </div>
      </div>

      {/* Progress */}
      <div className="mt-3 flex items-center gap-2">
        <div className="flex-1 h-1 bg-white/8 rounded-full overflow-hidden">
          <div
            className="h-full bg-green-400 rounded-full transition-all"
            style={{ width: `${progress}%` }}
          />
        </div>
        <span className="text-white/30 text-[10px] shrink-0">{doneCount}/{totalCount}</span>
        <button
          onClick={() => setExpanded((v) => !v)}
          className="text-white/25 hover:text-white/60 text-[11px] transition-colors ml-1"
        >
          {expanded ? "▲" : "▼"}
        </button>
      </div>

      {/* Finance projection */}
      {goal.financeGoal && <FinanceProjection goal={goal.financeGoal} />}

      {/* Plan steps */}
      {expanded && (
        <div className="mt-3 space-y-2">
          {goal.plan.map((step, idx) => (
            <button
              key={idx}
              onClick={() => toggleStep(idx)}
              className="w-full flex items-start gap-2.5 text-left group"
            >
              <div className={`w-4 h-4 rounded-full border flex items-center justify-center shrink-0 mt-0.5 transition-all ${
                step.done
                  ? "bg-green-500/20 border-green-500/40"
                  : "border-white/15 group-hover:border-white/30"
              }`}>
                {step.done && <span className="text-green-400 text-[9px]">✓</span>}
              </div>
              <div className="flex-1 min-w-0">
                <span className={`text-xs ${step.done ? "text-white/25 line-through" : "text-white/70"}`}>
                  {step.step}
                </span>
                <span className="text-white/25 text-[10px] ml-2">{step.timeframe}</span>
              </div>
            </button>
          ))}
        </div>
      )}

      {/* Tags */}
      {goal.tags.length > 0 && (
        <div className="flex gap-1.5 mt-3 flex-wrap">
          {goal.tags.map((tag) => (
            <span key={tag} className="text-[10px] text-white/25 bg-white/5 border border-white/8 px-2 py-0.5 rounded-full">
              #{tag}
            </span>
          ))}
        </div>
      )}
    </div>
  );
}

export default function SmartGoals() {
  const [goals, setGoals] = useState<SmartGoal[]>([]);

  useEffect(() => {
    setGoals(loadGoals());
  }, []);

  function handleUpdate(updated: SmartGoal) {
    const next = goals.map((g) => (g.id === updated.id ? updated : g));
    setGoals(next);
    saveGoals(next);
  }

  function handleDelete(id: string) {
    const next = goals.filter((g) => g.id !== id);
    setGoals(next);
    saveGoals(next);
  }

  const grouped = allCategories.reduce((acc, cat) => {
    acc[cat] = goals.filter((g) => g.category === cat);
    return acc;
  }, {} as Record<string, SmartGoal[]>);

  const hasAny = goals.length > 0;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-semibold tracking-tight text-white">Goals</h1>
        <p className="text-white/35 mt-1 text-sm">Your AI-generated plans, tracked here.</p>
      </div>

      {!hasAny ? (
        <div className="card p-10 text-center">
          <p className="text-white/25 text-lg mb-2">◎</p>
          <p className="text-white/40 text-sm font-medium">No goals yet</p>
          <p className="text-white/20 text-xs mt-1">Add one from the Home tab to get started</p>
        </div>
      ) : (
        <div className="space-y-8">
          {allCategories.map((cat) => {
            const items = grouped[cat];
            if (!items || items.length === 0) return null;
            return (
              <section key={cat}>
                <div className="flex items-center gap-2 mb-3">
                  <span className={`text-base ${categoryColors[cat]}`}>
                    {categoryIcons[cat]}
                  </span>
                  <h2 className="text-white/80 font-semibold text-sm">{categoryLabels[cat]}</h2>
                  <span className={`text-[10px] px-2 py-0.5 rounded-full border ${categoryBg[cat]} ${categoryColors[cat]}`}>
                    {items.length}
                  </span>
                </div>
                <div className="space-y-3">
                  {items.map((goal) => (
                    <GoalCard
                      key={goal.id}
                      goal={goal}
                      onUpdate={handleUpdate}
                      onDelete={handleDelete}
                    />
                  ))}
                </div>
              </section>
            );
          })}
        </div>
      )}
    </div>
  );
}
