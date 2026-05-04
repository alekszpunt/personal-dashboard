"use client";
import { useState } from "react";

const courses = [
  { id: 1, name: "Interior Design Diploma", category: "Design", progress: 50, notes: "1 year remaining. £350/month. Worth finishing." },
  { id: 2, name: "AI Prompting & Image Models", category: "AI", progress: 40, notes: "Self-taught. Midjourney, Higgsfield. Keep building." },
  { id: 3, name: "Money & Investing Basics", category: "Finance", progress: 5, notes: "Starting now. ISA, index funds, compound interest." },
];

const categoryColors: Record<string, string> = {
  Design: "text-purple-400 bg-purple-400/10 border-purple-400/20",
  AI: "text-blue-400 bg-blue-400/10 border-blue-400/20",
  Finance: "text-green-400 bg-green-400/10 border-green-400/20",
};

export default function Learning() {
  const [inspiration, setInspiration] = useState("");
  const [list, setList] = useState<string[]>([]);

  const add = () => {
    if (!inspiration.trim()) return;
    setList([...list, inspiration]);
    setInspiration("");
  };

  return (
    <div className="space-y-4">

      <div className="glass p-5">
        <h2 className="text-white font-semibold text-sm uppercase tracking-wide mb-5">Courses & Learning</h2>
        <div className="space-y-5">
          {courses.map((c) => (
            <div key={c.id}>
              <div className="flex items-center justify-between mb-2">
                <span className="text-white/80 text-sm font-medium">{c.name}</span>
                <span className={`text-xs px-2 py-0.5 rounded-full border ${categoryColors[c.category] || "text-white/40 bg-white/5 border-white/10"}`}>{c.category}</span>
              </div>
              <div className="w-full bg-white/5 rounded-full h-1.5 mb-1">
                <div className="bg-green-400 h-1.5 rounded-full transition-all" style={{ width: `${c.progress}%` }} />
              </div>
              <div className="flex justify-between text-xs text-white/30">
                <span>{c.notes}</span>
                <span>{c.progress}%</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="glass p-5">
        <h2 className="text-white font-semibold text-sm uppercase tracking-wide mb-1">Inspiration Drop</h2>
        <p className="text-white/30 text-xs mb-4">Paste a link instead of saving to Instagram and forgetting. Bring it to Claude to break it down.</p>
        <div className="flex gap-2 mb-3">
          <input
            value={inspiration}
            onChange={(e) => setInspiration(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && add()}
            placeholder="Paste a link or idea..."
            className="flex-1 glass-input text-white text-sm px-4 py-2 outline-none placeholder:text-white/20 bg-transparent"
          />
          <button onClick={add} className="glass-pill-active text-black text-sm font-medium px-4 py-2 rounded-xl">Save</button>
        </div>
        {list.length > 0 && (
          <div className="space-y-2">
            {list.map((item, i) => (
              <div key={i} className="glass-input px-4 py-2 text-sm text-white/60 break-all">{item}</div>
            ))}
          </div>
        )}
      </div>

    </div>
  );
}
