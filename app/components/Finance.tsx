"use client";

const debts = [
  { name: "Overdraft", total: 1700 },
  { name: "British Gas", total: 700 },
  { name: "HMRC", total: 700 },
  { name: "Derek", total: 1300 },
  { name: "Alastair (bike + licence)", total: 3000 },
  { name: "Interior Design Course", total: 3500 },
];

const totalDebt = debts.reduce((a, b) => a + b.total, 0);
const payout = 11250;

const expenses = [
  { name: "Interior Design Course", amount: 350 },
  { name: "Food", amount: 300 },
  { name: "Transport", amount: 150 },
  { name: "Personal / misc", amount: 200 },
];

export default function Finance() {
  const income = 1920;
  const taxRate = 0.2;
  const taxPot = income * taxRate;
  const takeHome = income - taxPot;
  const totalExpenses = expenses.reduce((a, b) => a + b.amount, 0);
  const leftOver = takeHome - totalExpenses;

  return (
    <div className="space-y-4">

      {/* Summary cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <GlassCard label="Monthly Income" value={`£${income.toLocaleString()}`} sub="before tax" />
        <GlassCard label="Take Home" value={`£${takeHome.toLocaleString()}`} sub="after tax set-aside" />
        <GlassCard label="Tax Pot" value={`£${taxPot.toLocaleString()}`} sub="set aside monthly" color="yellow" />
        <GlassCard label="Left After Bills" value={`£${leftOver.toLocaleString()}`} sub="per month" color={leftOver > 0 ? "green" : "red"} />
      </div>

      {/* Payout */}
      <div className="glass-green p-5">
        <h2 className="text-green-400 font-semibold mb-1 text-sm uppercase tracking-wide">Personal Injury Payout</h2>
        <p className="text-white/50 text-xs mb-4">~£11,250 net after solicitor fees. Clears all debt when it lands.</p>
        <div className="space-y-2">
          <Row label="Total debt" value={`£${totalDebt.toLocaleString()}`} />
          <Row label="Payout (net)" value={`£${payout.toLocaleString()}`} valueColor="text-green-400" />
          <div className="border-t border-white/10 pt-2">
            <Row label="Left after clearing debt" value={`£${(payout - totalDebt).toLocaleString()}`} valueColor="text-green-400 font-bold text-base" />
          </div>
        </div>
        <div className="mt-3 flex items-center gap-2 bg-yellow-400/10 border border-yellow-400/20 rounded-xl px-3 py-2">
          <span className="text-yellow-400 text-xs">⚠ Do NOT settle until after orthopaedic surgeon appointment</span>
        </div>
      </div>

      {/* Debt tracker */}
      <div className="glass p-5">
        <h2 className="text-white font-semibold mb-4 text-sm uppercase tracking-wide">Debt Tracker</h2>
        <div className="space-y-4">
          {debts.map((debt) => (
            <div key={debt.name}>
              <div className="flex justify-between text-sm mb-1.5">
                <span className="text-white/70">{debt.name}</span>
                <span className="text-white font-medium">£{debt.total.toLocaleString()}</span>
              </div>
              <div className="w-full bg-white/5 rounded-full h-1.5">
                <div className="bg-red-400 h-1.5 rounded-full" style={{ width: "100%" }} />
              </div>
            </div>
          ))}
        </div>
        <p className="text-white/20 text-xs mt-4">Total: £{totalDebt.toLocaleString()} — fully cleared by payout</p>
      </div>

      {/* Outgoings */}
      <div className="glass p-5">
        <h2 className="text-white font-semibold mb-4 text-sm uppercase tracking-wide">Monthly Outgoings</h2>
        <div className="space-y-2">
          {expenses.map((e) => (
            <div key={e.name} className="flex justify-between text-sm">
              <span className="text-white/50">{e.name}</span>
              <span className="text-white">£{e.amount}</span>
            </div>
          ))}
          <div className="flex justify-between text-sm border-t border-white/10 pt-2 mt-1">
            <span className="text-white/50">Total</span>
            <span className="text-white font-medium">£{totalExpenses}</span>
          </div>
        </div>
      </div>

    </div>
  );
}

function GlassCard({ label, value, sub, color = "default" }: { label: string; value: string; sub: string; color?: string }) {
  const colors: Record<string, string> = {
    default: "text-white",
    green: "text-green-400",
    red: "text-red-400",
    yellow: "text-yellow-400",
  };
  return (
    <div className="glass p-4">
      <p className="text-white/40 text-xs mb-1">{label}</p>
      <p className={`text-2xl font-semibold tracking-tight ${colors[color]}`}>{value}</p>
      <p className="text-white/25 text-xs mt-1">{sub}</p>
    </div>
  );
}

function Row({ label, value, valueColor = "text-white" }: { label: string; value: string; valueColor?: string }) {
  return (
    <div className="flex justify-between text-sm">
      <span className="text-white/50">{label}</span>
      <span className={valueColor}>{value}</span>
    </div>
  );
}
