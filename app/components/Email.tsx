"use client";
import { useState, useEffect, useCallback } from "react";

type Priority = "urgent" | "reply" | "fyi" | "ignore";

type EmailItem = {
  uid: number;
  from: string;
  fromName: string;
  subject: string;
  date: string;
  preview: string;
  priority: Priority;
  summary: string;
};

const priorityConfig: Record<Priority, { label: string; colour: string; dot: string }> = {
  urgent: { label: "Urgent",  colour: "text-red-400 bg-red-400/10 border-red-400/20",    dot: "bg-red-400" },
  reply:  { label: "Reply",   colour: "text-yellow-400 bg-yellow-400/10 border-yellow-400/20", dot: "bg-yellow-400" },
  fyi:    { label: "FYI",     colour: "text-blue-400 bg-blue-400/10 border-blue-400/20",  dot: "bg-blue-400" },
  ignore: { label: "Ignore",  colour: "text-white/30 bg-white/5 border-white/10",         dot: "bg-white/20" },
};

function timeAgo(iso: string) {
  if (!iso) return "";
  const diff = Date.now() - new Date(iso).getTime();
  const h = Math.floor(diff / 3600000);
  if (h < 1) return "just now";
  if (h < 24) return `${h}h ago`;
  const d = Math.floor(h / 24);
  if (d < 7) return `${d}d ago`;
  return new Date(iso).toLocaleDateString("en-GB", { day: "numeric", month: "short" });
}

export default function Email() {
  const [emails, setEmails] = useState<EmailItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [selected, setSelected] = useState<EmailItem | null>(null);
  const [draft, setDraft] = useState("");
  const [draftLoading, setDraftLoading] = useState(false);
  const [copied, setCopied] = useState(false);
  const [filter, setFilter] = useState<Priority | "all">("all");

  const fetchEmails = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/email");
      const data = await res.json();
      if (data.error) throw new Error(data.error);
      setEmails(data.emails ?? []);
    } catch (e) {
      setError(String(e));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchEmails(); }, [fetchEmails]);

  const selectEmail = async (email: EmailItem) => {
    setSelected(email);
    setDraft("");
    setCopied(false);
  };

  const getDraft = async () => {
    if (!selected) return;
    setDraftLoading(true);
    try {
      const res = await fetch("/api/email/reply", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ uid: selected.uid }),
      });
      const data = await res.json();
      setDraft(data.draft ?? "");
    } catch {
      setDraft("Failed to generate reply.");
    } finally {
      setDraftLoading(false);
    }
  };

  const copyDraft = () => {
    navigator.clipboard.writeText(draft);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const counts = {
    urgent: emails.filter(e => e.priority === "urgent").length,
    reply:  emails.filter(e => e.priority === "reply").length,
    fyi:    emails.filter(e => e.priority === "fyi").length,
    ignore: emails.filter(e => e.priority === "ignore").length,
  };

  const visible = filter === "all" ? emails : emails.filter(e => e.priority === filter);

  return (
    <div className="space-y-4">
      {/* Summary bar */}
      <div className="glass p-5">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-white font-semibold text-sm uppercase tracking-wide">Inbox</h2>
            <p className="text-white/30 text-xs mt-0.5">AI-sorted — newest first</p>
          </div>
          <button
            onClick={fetchEmails}
            disabled={loading}
            className="glass-pill text-white/50 hover:text-white text-xs px-3 py-1.5 rounded-full transition-colors disabled:opacity-40"
          >
            {loading ? "Loading…" : "Refresh"}
          </button>
        </div>

        {/* Priority pills */}
        <div className="flex gap-2 flex-wrap">
          {(["all", "urgent", "reply", "fyi", "ignore"] as const).map(p => {
            const isActive = filter === p;
            const count = p === "all" ? emails.length : counts[p];
            return (
              <button
                key={p}
                onClick={() => setFilter(p)}
                className={`px-3 py-1 rounded-full text-xs font-medium border transition-all ${
                  isActive
                    ? p === "urgent" ? "bg-red-400/20 border-red-400/40 text-red-300"
                    : p === "reply"  ? "bg-yellow-400/20 border-yellow-400/40 text-yellow-300"
                    : p === "fyi"    ? "bg-blue-400/20 border-blue-400/40 text-blue-300"
                    : p === "ignore" ? "bg-white/10 border-white/20 text-white/50"
                    : "glass-pill-active text-black"
                    : "glass-pill text-white/40 hover:text-white/70"
                }`}
              >
                {p === "all" ? `All (${count})` : `${priorityConfig[p].label} (${count})`}
              </button>
            );
          })}
        </div>
      </div>

      {error && (
        <div className="glass p-4 border border-red-400/20">
          <p className="text-red-400 text-sm">{error}</p>
          <p className="text-white/30 text-xs mt-1">Check your .env.local credentials and try again.</p>
        </div>
      )}

      {loading && (
        <div className="glass p-8 flex items-center justify-center">
          <div className="text-white/40 text-sm">Fetching your inbox…</div>
        </div>
      )}

      {!loading && !error && visible.length === 0 && (
        <div className="glass p-8 flex items-center justify-center">
          <p className="text-white/30 text-sm">No emails in this category.</p>
        </div>
      )}

      {/* Email list + detail */}
      {!loading && visible.length > 0 && (
        <div className="grid grid-cols-1 gap-3">
          {visible.map(email => {
            const cfg = priorityConfig[email.priority];
            const isSelected = selected?.uid === email.uid;
            return (
              <div key={email.uid}>
                <button
                  onClick={() => selectEmail(email)}
                  className={`w-full text-left glass p-4 transition-all duration-200 hover:border-white/20 ${
                    isSelected ? "border-green-400/30 bg-green-400/5" : ""
                  }`}
                >
                  <div className="flex items-start gap-3">
                    <div className={`w-2 h-2 rounded-full mt-1.5 flex-shrink-0 ${cfg.dot}`} />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-2 mb-1">
                        <span className="text-white/80 text-sm font-medium truncate">{email.fromName}</span>
                        <span className="text-white/30 text-xs flex-shrink-0">{timeAgo(email.date)}</span>
                      </div>
                      <p className="text-white/50 text-xs truncate mb-1">{email.subject}</p>
                      <p className="text-white/70 text-sm">{email.summary}</p>
                    </div>
                    <span className={`text-xs px-2 py-0.5 rounded-full border flex-shrink-0 ${cfg.colour}`}>
                      {cfg.label}
                    </span>
                  </div>
                </button>

                {/* Detail panel — inline below selected */}
                {isSelected && (
                  <div className="glass-green p-5 mt-1">
                    <div className="mb-3">
                      <p className="text-white/40 text-xs uppercase tracking-wide mb-1">From</p>
                      <p className="text-white/80 text-sm">{email.fromName} <span className="text-white/40">({email.from})</span></p>
                    </div>
                    <div className="mb-4">
                      <p className="text-white/40 text-xs uppercase tracking-wide mb-1">Subject</p>
                      <p className="text-white/80 text-sm">{email.subject}</p>
                    </div>
                    <div className="mb-4">
                      <p className="text-white/40 text-xs uppercase tracking-wide mb-1">AI Summary</p>
                      <p className="text-white text-sm">{email.summary}</p>
                    </div>

                    {!draft && (
                      <button
                        onClick={getDraft}
                        disabled={draftLoading}
                        className="glass-pill-active text-black text-sm font-medium px-4 py-2 rounded-xl transition-opacity disabled:opacity-50"
                      >
                        {draftLoading ? "Drafting reply…" : "Draft reply"}
                      </button>
                    )}

                    {draft && (
                      <div>
                        <p className="text-white/40 text-xs uppercase tracking-wide mb-2">Draft Reply</p>
                        <div className="glass p-4 mb-3">
                          <p className="text-white/80 text-sm whitespace-pre-wrap leading-relaxed">{draft}</p>
                        </div>
                        <div className="flex gap-2">
                          <button
                            onClick={copyDraft}
                            className="glass-pill-active text-black text-sm font-medium px-4 py-2 rounded-xl transition-opacity"
                          >
                            {copied ? "Copied!" : "Copy reply"}
                          </button>
                          <button
                            onClick={getDraft}
                            disabled={draftLoading}
                            className="glass-pill text-white/60 hover:text-white text-sm px-4 py-2 rounded-xl transition-colors disabled:opacity-40"
                          >
                            Regenerate
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
