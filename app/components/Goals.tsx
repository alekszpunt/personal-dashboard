"use client";

const goals = [
  { label: "Debt cleared", done: false, target: "When payout lands" },
  { label: "Own place", done: false, target: "End of 2026" },
  { label: "Motorbike or car", done: false, target: "End of 2026" },
  { label: "Pay rise to £24/hr confirmed", done: false, target: "11 May 2026" },
  { label: "Interior design course finished", done: false, target: "Mid 2027" },
  { label: "Credit score rebuilding started", done: false, target: "After payout" },
  { label: "Orthopaedic surgeon booked", done: false, target: "This week" },
  { label: "Teeth whitening", done: false, target: "After debt cleared" },
  { label: "Brows & lashes sorted", done: false, target: "After debt cleared" },
  { label: "Start investing", done: false, target: "After debt cleared" },
];

const feelGood = [
  { label: "Teeth whitening", estimate: "£300–500" },
  { label: "Brows & lashes", estimate: "£100–200" },
  { label: "Emergency buffer", estimate: "£1,000" },
];

export default function Goals() {
  const done = goals.filter((g) => g.done).length;
  const percent = Math.round((done / goals.length) * 100);

  return (
    <div className="space-y-4">

      <div className="glass p-5">
        <div className="flex justify-between items-center mb-2">
          <h2 className="text-white font-semibold text-sm uppercase tracking-wide">2026 Goals</h2>
          <span className="text-green-400 text-sm">{done}/{goals.length}</span>
        </div>
        <div className="w-full bg-white/5 rounded-full h-1.5 mb-5">
          <div className="bg-green-400 h-1.5 rounded-full transition-all" style={{ width: `${percent || 2}%` }} />
        </div>
        <div className="space-y-3">
          {goals.map((g) => (
            <div key={g.label} className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className={`w-4 h-4 rounded-full border flex items-center justify-center flex-shrink-0 ${
                  g.done ? "bg-green-500 border-green-500" : "border-white/20"
                }`}>
                  {g.done && <span className="text-black text-[10px]">✓</span>}
                </div>
                <span className={`text-sm ${g.done ? "line-through text-white/30" : "text-white/80"}`}>{g.label}</span>
              </div>
              <span className="text-xs text-white/25 ml-4 shrink-0">{g.target}</span>
            </div>
          ))}
        </div>
      </div>

      <div className="glass p-5">
        <h2 className="text-white font-semibold mb-1 text-sm uppercase tracking-wide">Feel Good Pots 💚</h2>
        <p className="text-white/30 text-xs mb-4">Save for these once debt is cleared.</p>
        <div className="space-y-2">
          {feelGood.map((s) => (
            <div key={s.label} className="flex justify-between text-sm">
              <span className="text-white/60">{s.label}</span>
              <span className="text-green-400">{s.estimate}</span>
            </div>
          ))}
        </div>
      </div>

    </div>
  );
}
