"use client";
import { useEffect, useState } from "react";

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

type Balance = { name: string; accountName: string; type: string; current: number; available: number; currency: string };
type Transaction = { description: string; amount: number; date: string; type: string; category: string; account: string };
type CreditScore = { score: number; provider: string; updatedAt: string };

function getCreditBand(score: number): { label: string; color: string; textColor: string; percent: number } {
  if (score >= 961) return { label: "Excellent", color: "bg-green-500", textColor: "text-green-400", percent: 100 };
  if (score >= 881) return { label: "Good",      color: "bg-green-400", textColor: "text-green-400", percent: 80 };
  if (score >= 721) return { label: "Fair",       color: "bg-yellow-400", textColor: "text-yellow-400", percent: 55 };
  if (score >= 561) return { label: "Poor",       color: "bg-orange-400", textColor: "text-orange-400", percent: 35 };
  return                     { label: "Very Poor", color: "bg-red-500",    textColor: "text-red-400",    percent: 15 };
}

export default function Finance() {
  const income = 1920;
  const taxRate = 0.2;
  const taxPot = income * taxRate;
  const takeHome = income - taxPot;
  const totalExpenses = expenses.reduce((a, b) => a + b.amount, 0);
  const leftOver = takeHome - totalExpenses;

  const [balances, setBalances] = useState<Balance[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [bankConnected, setBankConnected] = useState(false);
  const [bankLoading, setBankLoading] = useState(false);
  const [bankError, setBankError] = useState("");

  // Credit score state
  const [creditScore, setCreditScore] = useState<CreditScore | null>(null);
  const [editingScore, setEditingScore] = useState(false);
  const [scoreInput, setScoreInput] = useState("");
  const [providerInput, setProviderInput] = useState("Experian");

  useEffect(() => {
    fetchBalances();
    const saved = localStorage.getItem("dashboard-credit-score");
    if (saved) {
      try { setCreditScore(JSON.parse(saved)); } catch {}
    }
  }, []);

  const saveScore = () => {
    const n = parseInt(scoreInput);
    if (isNaN(n) || n < 0 || n > 999) return;
    const entry: CreditScore = { score: n, provider: providerInput, updatedAt: new Date().toISOString() };
    setCreditScore(entry);
    localStorage.setItem("dashboard-credit-score", JSON.stringify(entry));
    setEditingScore(false);
    setScoreInput("");
  };

  const fetchBalances = async () => {
    setBankLoading(true);
    setBankError("");
    try {
      const res = await fetch("/api/truelayer/balance");
      if (res.status === 401) { setBankConnected(false); return; }
      const data = await res.json();
      if (data.balances) {
        setBalances(data.balances);
        setBankConnected(true);
        const txRes = await fetch("/api/truelayer/transactions");
        const txData = await txRes.json();
        if (txData.transactions) setTransactions(txData.transactions);
      }
    } catch {
      setBankError("Could not load balances.");
    } finally {
      setBankLoading(false);
    }
  };

  const totalAvailable = balances.reduce((a, b) => a + b.available, 0);
  const band = creditScore ? getCreditBand(creditScore.score) : null;

  return (
    <div className="space-y-5">

      {/* Page title */}
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Finance</h1>
        <p className="text-white/35 text-sm mt-0.5">Your money, all in one place.</p>
      </div>

      {/* Top stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard label="Monthly Income"  value={`£${income.toLocaleString()}`}    sub="before tax"           />
        <StatCard label="Take Home"       value={`£${takeHome.toLocaleString()}`}   sub="after tax set-aside"  color="green" />
        <StatCard label="Tax Pot"         value={`£${taxPot.toLocaleString()}`}     sub="set aside monthly"    color="yellow" />
        <StatCard label="Left After Bills" value={`£${leftOver.toLocaleString()}`}  sub="per month"            color={leftOver > 0 ? "green" : "red"} />
      </div>

      {/* Live Bank Balance */}
      <div className="card p-5">
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-semibold text-sm">Live Bank Balance</h2>
          {bankConnected && (
            <button onClick={fetchBalances} className="text-xs text-white/30 hover:text-white transition-colors">↻ Refresh</button>
          )}
        </div>

        {!bankConnected && !bankLoading && (
          <div className="text-center py-6">
            <p className="text-white/35 text-sm mb-4">Connect your bank to see your live balance.</p>
            <button onClick={() => window.location.href = "/api/truelayer/auth"}
              className="btn-primary text-sm px-6 py-2.5">
              Connect Nationwide
            </button>
          </div>
        )}
        {bankLoading && <p className="text-white/30 text-sm text-center py-4">Connecting to your bank…</p>}
        {bankError  && <p className="text-red-400 text-sm text-center py-2">{bankError}</p>}

        {bankConnected && balances.length > 0 && (
          <>
            <div className="card-green p-4 text-center mb-4">
              <p className="stat-label mb-1">Total Available</p>
              <p className={`text-4xl font-bold tracking-tight ${totalAvailable < 0 ? "text-red-400" : "text-green-400"}`}>
                £{totalAvailable.toFixed(2)}
              </p>
              <p className="text-white/25 text-xs mt-1">across {balances.length} account{balances.length > 1 ? "s" : ""}</p>
            </div>
            <div className="space-y-2">
              {balances.map((b, i) => (
                <div key={i} className="flex justify-between items-center bg-white/4 rounded-xl px-4 py-3">
                  <div>
                    <p className="text-white font-medium text-sm">{b.name}</p>
                    <p className="text-white/30 text-xs">{b.accountName} · {b.type}</p>
                  </div>
                  <p className={`text-base font-semibold ${b.current < 0 ? "text-red-400" : "text-white"}`}>
                    £{b.current.toFixed(2)}
                  </p>
                </div>
              ))}
            </div>
          </>
        )}
      </div>

      {/* Credit Score */}
      <div className="card p-5">
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-semibold text-sm">Credit Score</h2>
          <div className="flex gap-3 items-center">
            <a href="https://www.clearscore.com" target="_blank" rel="noopener noreferrer"
              className="text-xs text-white/30 hover:text-white transition-colors">ClearScore ↗</a>
            <a href="https://www.experian.co.uk" target="_blank" rel="noopener noreferrer"
              className="text-xs text-white/30 hover:text-white transition-colors">Experian ↗</a>
            <button onClick={() => setEditingScore(true)}
              className="text-xs text-green-400 hover:text-green-300 transition-colors">
              {creditScore ? "Update" : "+ Add score"}
            </button>
          </div>
        </div>

        {editingScore ? (
          <div className="space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="stat-label block mb-1.5">Score (0–999)</label>
                <input
                  type="number" min="0" max="999"
                  value={scoreInput}
                  onChange={(e) => setScoreInput(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && saveScore()}
                  placeholder="e.g. 720"
                  className="field w-full px-3 py-2 text-white text-sm"
                  autoFocus
                />
              </div>
              <div>
                <label className="stat-label block mb-1.5">Provider</label>
                <select
                  value={providerInput}
                  onChange={(e) => setProviderInput(e.target.value)}
                  className="field w-full px-3 py-2 text-white text-sm bg-transparent"
                >
                  <option value="Experian">Experian</option>
                  <option value="Equifax">Equifax</option>
                  <option value="TransUnion">TransUnion</option>
                  <option value="ClearScore">ClearScore</option>
                </select>
              </div>
            </div>
            <div className="flex gap-2">
              <button onClick={saveScore} className="btn-primary text-sm px-4 py-2">Save</button>
              <button onClick={() => setEditingScore(false)} className="btn-ghost text-sm px-4 py-2">Cancel</button>
            </div>
          </div>
        ) : creditScore && band ? (
          <div className="flex items-center gap-6">
            <div className="text-center">
              <p className={`text-5xl font-bold tracking-tight ${band.textColor}`}>{creditScore.score}</p>
              <p className={`text-sm font-medium mt-1 ${band.textColor}`}>{band.label}</p>
              <p className="stat-label mt-0.5">{creditScore.provider}</p>
            </div>
            <div className="flex-1">
              <div className="flex justify-between stat-label mb-1.5">
                <span>0</span><span>999</span>
              </div>
              <div className="progress-track h-3">
                <div className={`h-3 rounded-full transition-all ${band.color}`}
                  style={{ width: `${(creditScore.score / 999) * 100}%` }} />
              </div>
              <div className="grid grid-cols-5 mt-2 gap-1">
                {["Very Poor", "Poor", "Fair", "Good", "Excellent"].map((l) => (
                  <div key={l} className={`text-center text-[10px] ${band.label === l ? "text-white" : "text-white/20"}`}>{l}</div>
                ))}
              </div>
              <p className="text-white/25 text-xs mt-3">
                Last updated {new Date(creditScore.updatedAt).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" })}
              </p>
            </div>
          </div>
        ) : (
          <div className="text-center py-6 border border-dashed border-white/8 rounded-xl">
            <p className="text-white/25 text-sm mb-1">No score saved yet.</p>
            <p className="text-white/15 text-xs">Check ClearScore or Experian then add it here to track over time.</p>
          </div>
        )}
      </div>

      {/* Personal Injury Payout */}
      <div className="card-green p-5">
        <h2 className="text-green-400 font-semibold text-sm mb-1">Personal Injury Payout</h2>
        <p className="text-white/40 text-xs mb-4">~£11,250 net after solicitor fees. Clears all debt when it lands.</p>
        <div className="space-y-2 mb-3">
          <Row label="Total debt"             value={`£${totalDebt.toLocaleString()}`} />
          <Row label="Payout (net)"           value={`£${payout.toLocaleString()}`}    valueColor="text-green-400" />
          <div className="border-t border-white/8 pt-2">
            <Row label="Left after clearing"  value={`£${(payout - totalDebt).toLocaleString()}`} valueColor="text-green-400 font-bold" />
          </div>
        </div>
        <div className="flex items-center gap-2 bg-yellow-400/10 border border-yellow-400/15 rounded-xl px-3 py-2.5">
          <span className="text-yellow-400 text-xs">⚠ Do NOT settle until after orthopaedic surgeon appointment</span>
        </div>
      </div>

      {/* Debt Tracker */}
      <div className="card p-5">
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-semibold text-sm">Debt Tracker</h2>
          <span className="stat-label">£{totalDebt.toLocaleString()} total</span>
        </div>
        <div className="space-y-4">
          {debts.map((debt) => (
            <div key={debt.name}>
              <div className="flex justify-between text-sm mb-1.5">
                <span className="text-white/60">{debt.name}</span>
                <span className="text-white font-medium">£{debt.total.toLocaleString()}</span>
              </div>
              <div className="progress-track h-1.5">
                <div className="progress-fill-red h-1.5" style={{ width: `${(debt.total / totalDebt) * 100}%` }} />
              </div>
            </div>
          ))}
        </div>
        <p className="text-white/20 text-xs mt-4">Fully cleared by payout ✓</p>
      </div>

      {/* Monthly Outgoings */}
      <div className="card p-5">
        <h2 className="font-semibold text-sm mb-4">Monthly Outgoings</h2>
        <div className="space-y-2">
          {expenses.map((e) => (
            <div key={e.name} className="flex justify-between text-sm">
              <span className="text-white/50">{e.name}</span>
              <span className="text-white">£{e.amount}</span>
            </div>
          ))}
          <div className="flex justify-between text-sm border-t border-white/8 pt-2 mt-1">
            <span className="text-white/50">Total</span>
            <span className="text-white font-semibold">£{totalExpenses}</span>
          </div>
        </div>
      </div>

      {/* Recent Transactions */}
      {bankConnected && transactions.length > 0 && (
        <div className="card p-5">
          <h2 className="font-semibold text-sm mb-4">Recent Transactions</h2>
          <div className="space-y-3">
            {transactions.slice(0, 20).map((tx, i) => (
              <div key={i} className="flex items-center justify-between py-1 border-b border-white/5 last:border-0">
                <div className="flex-1 min-w-0">
                  <p className="text-white/80 text-sm truncate">{tx.description}</p>
                  <p className="text-white/25 text-xs">{new Date(tx.date).toLocaleDateString("en-GB")} · {tx.category}</p>
                </div>
                <p className={`text-sm font-medium ml-4 shrink-0 ${tx.amount < 0 ? "text-red-400" : "text-green-400"}`}>
                  {tx.amount < 0 ? "−" : "+"}£{Math.abs(tx.amount).toFixed(2)}
                </p>
              </div>
            ))}
          </div>
        </div>
      )}

    </div>
  );
}

function StatCard({ label, value, sub, color = "default" }: { label: string; value: string; sub: string; color?: string }) {
  const colors: Record<string, string> = { default: "text-white", green: "text-green-400", red: "text-red-400", yellow: "text-yellow-400" };
  return (
    <div className="card p-4">
      <p className="stat-label mb-2">{label}</p>
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
