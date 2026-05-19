"use client";
import { useState } from "react";
import Home from "./components/Home";
import Finance from "./components/Finance";
import Goals from "./components/Goals";
import Tasks from "./components/Tasks";
import Learning from "./components/Learning";
import Health from "./components/Health";
import Email from "./components/Email";
import Moodboard from "./components/Moodboard";

const tabs = [
  { id: "Home",      icon: "⌂",  label: "Home" },
  { id: "Finance",   icon: "₤",  label: "Finance" },
  { id: "Goals",     icon: "◎",  label: "Goals" },
  { id: "Tasks",     icon: "✓",  label: "Tasks" },
  { id: "Learning",  icon: "▶",  label: "Learning" },
  { id: "Moodboard", icon: "◈",  label: "Moodboard" },
  { id: "Health",    icon: "♡",  label: "Health" },
  { id: "Email",     icon: "✉",  label: "Email" },
];

export default function DashboardPage() {
  const [active, setActive] = useState("Home");

  return (
    <div
      className="min-h-screen text-white flex flex-col"
      style={{ background: "linear-gradient(135deg, #060a06 0%, #080b08 50%, #060806 100%)" }}
    >
      {/* Top header */}
      <header className="border-b border-white/5 px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-7 h-7 rounded-lg bg-green-500/20 border border-green-500/30 flex items-center justify-center">
            <span className="text-green-400 text-xs font-bold">A</span>
          </div>
          <span className="text-white/60 text-sm font-medium">Alexandra's Dashboard</span>
        </div>
        <div className="text-white/20 text-xs">
          {new Date().toLocaleDateString("en-GB", { weekday: "short", day: "numeric", month: "short" })}
        </div>
      </header>

      <div className="flex flex-1 overflow-hidden">
        {/* Sidebar nav — desktop */}
        <nav className="hidden md:flex flex-col w-52 border-r border-white/5 px-3 py-6 gap-1 shrink-0">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActive(tab.id)}
              className={`nav-pill flex items-center gap-3 px-3 py-2.5 text-sm text-left w-full ${
                active === tab.id ? "nav-pill-active" : ""
              }`}
            >
              <span className="text-base w-5 text-center opacity-70">{tab.icon}</span>
              <span>{tab.label}</span>
            </button>
          ))}
        </nav>

        {/* Main content */}
        <main className="flex-1 overflow-y-auto px-4 md:px-8 py-6">
          <div className="w-full">
            {active === "Home"      && <Home setActive={setActive} />}
            {active === "Finance"   && <Finance />}
            {active === "Goals"     && <Goals />}
            {active === "Tasks"     && <Tasks />}
            {active === "Learning"  && <Learning />}
            {active === "Moodboard" && <Moodboard />}
            {active === "Health"    && <Health />}
            {active === "Email"     && <Email />}
          </div>
        </main>
      </div>

      {/* Bottom nav — mobile */}
      <nav className="md:hidden flex border-t border-white/5 bg-black/40 backdrop-blur-xl overflow-x-auto">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActive(tab.id)}
            className={`flex flex-col items-center gap-1 px-4 py-3 text-xs shrink-0 transition-colors ${
              active === tab.id ? "text-green-400" : "text-white/30"
            }`}
          >
            <span className="text-lg leading-none">{tab.icon}</span>
            <span>{tab.label}</span>
          </button>
        ))}
      </nav>
    </div>
  );
}
