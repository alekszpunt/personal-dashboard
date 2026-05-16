"use client";
import { useState, useEffect } from "react";

type Task = { id: number; text: string; done: boolean; priority: "high" | "medium" | "low" };

const initial: Task[] = [
  { id: 1, text: "Book orthopaedic surgeon via solicitor", done: false, priority: "high" },
  { id: 2, text: "Confirm £24/hr pay rise on 11 May", done: false, priority: "high" },
  { id: 3, text: "Send this week's invoice to Alastair", done: false, priority: "high" },
];

const colors = {
  high: "text-red-400 bg-red-400/10 border-red-400/20",
  medium: "text-yellow-400 bg-yellow-400/10 border-yellow-400/20",
  low: "text-white/40 bg-white/5 border-white/10",
};

export default function Tasks() {
  const [tasks, setTasks] = useState<Task[]>(initial);
  const [newTask, setNewTask] = useState("");
  const [priority, setPriority] = useState<"high" | "medium" | "low">("medium");

  // Load from localStorage on mount
  useEffect(() => {
    const saved = localStorage.getItem("dashboard-tasks");
    if (saved) {
      try {
        setTasks(JSON.parse(saved));
      } catch (e) {
        console.error("Failed to parse saved tasks", e);
      }
    }
  }, []);

  // Save to localStorage whenever tasks change
  useEffect(() => {
    localStorage.setItem("dashboard-tasks", JSON.stringify(tasks));
  }, [tasks]);

  const addTask = () => {
    if (!newTask.trim()) return;
    setTasks([...tasks, { id: Date.now(), text: newTask, done: false, priority }]);
    setNewTask("");
  };

  const toggle = (id: number) => setTasks(tasks.map((t) => (t.id === id ? { ...t, done: !t.done } : t)));
  const remove = (id: number) => setTasks(tasks.filter((t) => t.id !== id));

  const active = tasks.filter((t) => !t.done);
  const done = tasks.filter((t) => t.done);

  return (
    <div className="space-y-4">
      <div className="glass p-5">
        <h2 className="text-white font-semibold text-sm uppercase tracking-wide mb-1">This Week</h2>
        <p className="text-white/30 text-xs mb-5">Max 3 priorities. Focus only on these.</p>

        <div className="space-y-3 mb-5">
          {active.map((t) => (
            <div key={t.id} className="flex items-center gap-3 group">
              <button
                onClick={() => toggle(t.id)}
                className="w-5 h-5 rounded-full border border-white/20 hover:border-green-400 flex-shrink-0 transition-colors"
              />
              <span className="text-white/80 text-sm flex-1">{t.text}</span>
              <span className={`text-xs px-2 py-0.5 rounded-full border ${colors[t.priority]}`}>{t.priority}</span>
              <button onClick={() => remove(t.id)} className="text-white/20 hover:text-red-400 text-xs opacity-0 group-hover:opacity-100 transition-all">✕</button>
            </div>
          ))}
        </div>

        <div className="space-y-2">
          <input
            value={newTask}
            onChange={(e) => setNewTask(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && addTask()}
            placeholder="Add a task..."
            className="w-full glass-input text-white text-sm px-4 py-2 outline-none placeholder:text-white/20 bg-transparent"
          />
          <div className="flex gap-2">
            <div className="flex gap-1 bg-white/5 rounded-xl p-1">
              <button
                onClick={() => setPriority("high")}
                className={`text-xs px-3 py-1.5 rounded-lg transition-all ${
                  priority === "high" ? "bg-red-400/20 text-red-400" : "text-white/40 hover:text-white/60"
                }`}
              >
                High
              </button>
              <button
                onClick={() => setPriority("medium")}
                className={`text-xs px-3 py-1.5 rounded-lg transition-all ${
                  priority === "medium" ? "bg-yellow-400/20 text-yellow-400" : "text-white/40 hover:text-white/60"
                }`}
              >
                Med
              </button>
              <button
                onClick={() => setPriority("low")}
                className={`text-xs px-3 py-1.5 rounded-lg transition-all ${
                  priority === "low" ? "bg-white/10 text-white/60" : "text-white/40 hover:text-white/60"
                }`}
              >
                Low
              </button>
            </div>
            <button onClick={addTask} className="flex-1 glass-pill-active text-black text-sm font-medium px-4 py-2 rounded-xl hover:opacity-90 transition-opacity">
              Add
            </button>
          </div>
        </div>
      </div>

      {done.length > 0 && (
        <div className="glass p-5">
          <h2 className="text-white/30 font-semibold text-sm uppercase tracking-wide mb-3">Completed</h2>
          <div className="space-y-2">
            {done.map((t) => (
              <div key={t.id} className="flex items-center gap-3">
                <button onClick={() => toggle(t.id)} className="w-5 h-5 rounded-full bg-green-500/40 border border-green-500/50 flex-shrink-0" />
                <span className="text-white/25 text-sm line-through">{t.text}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
