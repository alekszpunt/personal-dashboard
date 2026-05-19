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

const tabs = ["Home", "Finance", "Goals", "Tasks", "Learning", "Moodboard", "Health", "Email"];

export default function DashboardPage() {
  const [active, setActive] = useState("Home");

  return (
    <main className="min-h-screen text-white relative overflow-hidden"
      style={{
        background: "radial-gradient(ellipse at 20% 20%, #0d2818 0%, #050f0a 40%, #000000 100%)"
      }}
    >
      {/* Ambient glow blobs */}
      <div className="fixed top-[-200px] left-[-200px] w-[600px] h-[600px] rounded-full opacity-20 pointer-events-none"
        style={{ background: "radial-gradient(circle, #22c55e 0%, transparent 70%)" }} />
      <div className="fixed bottom-[-200px] right-[-200px] w-[500px] h-[500px] rounded-full opacity-10 pointer-events-none"
        style={{ background: "radial-gradient(circle, #16a34a 0%, transparent 70%)" }} />

      <div className="max-w-5xl mx-auto px-4 py-8 relative z-10">
        <div className="mb-8">
          <h1 className="text-3xl font-semibold tracking-tight text-white">Alexandra&apos;s Dashboard</h1>
          <p className="text-white/40 mt-1 text-sm">Your external brain. Everything in one place.</p>
        </div>

        {/* Tabs */}
        <div className="flex gap-2 mb-8 flex-wrap">
          {tabs.map((tab) => (
            <button
              key={tab}
              onClick={() => setActive(tab)}
              className={`px-5 py-2 rounded-full text-sm font-medium transition-all duration-200 ${
                active === tab
                  ? "glass-pill-active text-black"
                  : "glass-pill text-white/60 hover:text-white"
              }`}
            >
              {tab}
            </button>
          ))}
        </div>

        <div>
          {active === "Home" && <Home />}
          {active === "Finance" && <Finance />}
          {active === "Goals" && <Goals />}
          {active === "Tasks" && <Tasks />}
          {active === "Learning" && <Learning />}
          {active === "Moodboard" && <Moodboard />}
          {active === "Health" && <Health />}
          {active === "Email" && <Email />}
        </div>
      </div>
    </main>
  );
}
