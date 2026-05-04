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

type Balance = { name: string; type: string; balance: number; currency: string };
type Transaction = { description: string; amount: number; date: string; type: string; category: string; account: string };

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

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get("connected") === "true") {
      fetchBalances();
    }
  }, []);

  const fetchBalances = async () => {
    setBankLoading(true);
    setBankError("");
    try {
      const res = await fetch("/api/truelayer/balance");
      if (res.status === 401) {
        setBankConnected(false);
        return;
      }
      const data = await res.json();
      if (data.balances) {
        setBalances(data.balances);
        setBankConnected(true);
        // fetch transactions
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

  const connectBank = () => {
    window.location.href = "/api/truelayer/auth";
  };

  const totalAvailable = balances.reduce((a, b) => a + b.balance, 0);

  return (
    <div className="space-y-4">

      {/* Hero Balance Card */}
      {bankConnected && balances.length > 0 && (
        <div className="glass-green p-6 text-center">
          <p className="text-white/40 text-xs uppercase tracking-widest mb-2">Total Available Balance</p>
          <p className={`text-5xl font-bold tracking-tight mb-1 ${totalAvailable < 0 ? "text-red-400" : "text-green-400"}`}>
            £{totalAvailable.toFixed(2)}
          </p>
          <p className="text-white/30 text-xs">across {balances.length} account{balances.length > 1 ? "s" : ""}</p>
          <button onClick={fetchBalances} className="mt-3 text-xs text-white/20 hover:text-white transition-colors">↻ Refresh</button>
        </div>
      )}

      {/* Live Bank Balance */}
      <div className="glass p-5">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-white font-semibold text-sm uppercase tracking-wide">Live Bank Balance</h2>
          {bankConnected && (
            <button onClick={fetchBalances} className="text-xs text-white/30 hover:text-white transition-colors">Refresh</button>
          )}
        </div>

        {!bankConnected && !bankLoading && (
          <div className="text-center py-4">
            <p className="text-white/40 text-sm mb-4">Connect your Nationwide account to see your live balance.</p>
            <button
              onClick={connectBank}
              className="glass-pill-active text-black text-sm font-medium px-6 py-2.5 rounded-xl hover:opacity-90 transition-opacity"
            >
              Connect Nationwide
            </button>
          </div>
        )}

        {bankLoading && (
          <p className="text-white/30 text-sm text-center py-4">Connecting to your bank...</p>
        )}

        {bankError && (
          <p className="text-red-400 text-sm text-center py-2">{bankError}</p>
        )}

        {bankConnected && balances.length > 0 && (
          <div className="space-y-3">
            {balances.map((b, i) => (
              <div key={i} className="flex justify-between items-center">
                <div>
                  <p className="text-white/80 text-sm">{b.name}</p>
                  <p className="text-white/30 text-xs">{b.type}</p>
                </div>
                <p className={`text-lg font-semibold ${b.balance < 0 ? "text-red-400" : "text-green-400"}`}>
                  £{b.balance.toFixed(2)}
                </p>
              </div>
            ))}
          </div>
        )}
      </div>

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

      {/* Live Transactions */}
      {bankConnected && transactions.length > 0 && (
        <div className="glass p-5">
          <h2 className="text-white font-semibold mb-4 text-sm uppercase tracking-wide">Recent Transactions</h2>
          <div className="space-y-3">
            {transactions.slice(0, 20).map((tx, i) => (
              <div key={i} className="flex items-center justify-between">
                <div className="flex-1 min-w-0">
                  <p className="text-white/80 text-sm truncate">{tx.description}</p>
                  <p className="text-white/25 text-xs">{new Date(tx.date).toLocaleDateString("en-GB")} · {tx.category}</p>
                </div>
                <p className={`text-sm font-medium ml-4 shrink-0 ${tx.amount < 0 ? "text-red-400" : "text-green-400"}`}>
                  {tx.amount < 0 ? "-" : "+"}£{Math.abs(tx.amount).toFixed(2)}
                </p>
              </div>
            ))}
          </div>
        </div>
      )}

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
