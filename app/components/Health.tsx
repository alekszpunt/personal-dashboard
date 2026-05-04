"use client";
import { useState } from "react";

const days = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
const moods = ["😔", "😕", "😐", "🙂", "😊"];

export default function Health() {
  const [workouts, setWorkouts] = useState<boolean[]>(Array(7).fill(false));
  const [mood, setMood] = useState(2);
  const [energy, setEnergy] = useState(3);
  const [notes, setNotes] = useState("");

  const toggle = (i: number) => {
    const updated = [...workouts];
    updated[i] = !updated[i];
    setWorkouts(updated);
  };

  return (
    <div className="space-y-4">

      <div className="glass p-5">
        <h2 className="text-white font-semibold text-sm uppercase tracking-wide mb-4">Workouts This Week</h2>
        <div className="flex gap-2">
          {days.map((day, i) => (
            <button
              key={day}
              onClick={() => toggle(i)}
              className={`flex-1 py-3 rounded-xl text-xs font-medium transition-all duration-200 ${
                workouts[i]
                  ? "glass-pill-active text-black"
                  : "glass-pill text-white/40 hover:text-white"
              }`}
            >
              {day}
            </button>
          ))}
        </div>
        <p className="text-white/25 text-xs mt-3">{workouts.filter(Boolean).length}/7 days this week</p>
      </div>

      <div className="glass p-5">
        <h2 className="text-white font-semibold text-sm uppercase tracking-wide mb-5">Daily Check-in</h2>

        <div className="mb-5">
          <p className="text-white/40 text-xs mb-3">Mood today</p>
          <div className="flex gap-4">
            {moods.map((m, i) => (
              <button
                key={i}
                onClick={() => setMood(i)}
                className={`text-2xl transition-all duration-200 ${mood === i ? "scale-125" : "opacity-30 hover:opacity-60"}`}
              >
                {m}
              </button>
            ))}
          </div>
        </div>

        <div className="mb-5">
          <p className="text-white/40 text-xs mb-2">Energy level</p>
          <input
            type="range" min={1} max={5} value={energy}
            onChange={(e) => setEnergy(Number(e.target.value))}
            className="w-full accent-green-400"
          />
          <div className="flex justify-between text-xs text-white/20 mt-1">
            <span>Drained</span><span>Energised</span>
          </div>
        </div>

        <div>
          <p className="text-white/40 text-xs mb-2">Brain dump</p>
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="How are you actually feeling today?"
            className="w-full glass-input text-white text-sm px-4 py-3 outline-none placeholder:text-white/20 resize-none h-24 bg-transparent"
          />
        </div>
      </div>

      <div className="glass p-5">
        <h2 className="text-white font-semibold text-sm uppercase tracking-wide mb-3">Daily Reminders</h2>
        <div className="grid grid-cols-2 gap-2 text-sm text-white/50">
          <p>💊 Take supplements</p>
          <p>💧 Drink water</p>
          <p>🚶 Move — even a walk counts</p>
          <p>😴 Protect your sleep</p>
        </div>
      </div>

    </div>
  );
}
