"use client";
import { useEffect, useRef, useState } from "react";

const PINTEREST_USERNAME = "alekszpunt";

type BoardEntry = { url: string; label: string };

const DEFAULT_BOARDS: BoardEntry[] = [
  { url: `https://www.pinterest.com/${PINTEREST_USERNAME}/`, label: "All Pins" },
];

export default function PinterestBoards() {
  const [boards, setBoards]         = useState<BoardEntry[]>(() => {
    if (typeof window === "undefined") return DEFAULT_BOARDS;
    try {
      const saved = localStorage.getItem("pinterest-boards");
      return saved ? JSON.parse(saved) : DEFAULT_BOARDS;
    } catch { return DEFAULT_BOARDS; }
  });
  const [active, setActive]         = useState(0);
  const [newUrl, setNewUrl]         = useState("");
  const [newLabel, setNewLabel]     = useState("");
  const [showAdd, setShowAdd]       = useState(false);
  const containerRef                = useRef<HTMLDivElement>(null);
  const scriptRef                   = useRef<HTMLScriptElement | null>(null);

  const saveBoards = (next: BoardEntry[]) => {
    setBoards(next);
    localStorage.setItem("pinterest-boards", JSON.stringify(next));
  };

  // Reload the Pinterest embed script whenever active board changes
  useEffect(() => {
    if (!containerRef.current) return;

    // Remove old script
    if (scriptRef.current) {
      scriptRef.current.remove();
      scriptRef.current = null;
    }
    // Remove old widget remnants Pinterest injects
    const old = containerRef.current.querySelectorAll("span[data-pin-rendered], iframe");
    old.forEach((el) => el.remove());

    // Re-inject script to re-render widget
    const script = document.createElement("script");
    script.src = "https://assets.pinterest.com/js/pinit.js";
    script.async = true;
    script.defer = true;
    document.body.appendChild(script);
    scriptRef.current = script;

    return () => {
      script.remove();
    };
  }, [active, boards]);

  const addBoard = () => {
    if (!newUrl.trim()) return;
    const label = newLabel.trim() || new URL(newUrl.includes("http") ? newUrl : `https://${newUrl}`).pathname.split("/").filter(Boolean).pop() || "Board";
    saveBoards([...boards, { url: newUrl.trim(), label }]);
    setNewUrl(""); setNewLabel(""); setShowAdd(false);
  };

  const removeBoard = (i: number) => {
    const next = boards.filter((_, idx) => idx !== i);
    saveBoards(next.length ? next : DEFAULT_BOARDS);
    if (active >= next.length) setActive(0);
  };

  const current = boards[active] ?? boards[0];

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="text-red-400 text-lg">📌</span>
          <h2 className="text-white font-semibold text-sm">Pinterest Boards</h2>
        </div>
        <button
          onClick={() => setShowAdd(!showAdd)}
          className="text-xs text-white/30 hover:text-white/60 transition-colors"
        >
          + Add board
        </button>
      </div>

      {/* Add board form */}
      {showAdd && (
        <div className="card p-4 space-y-2">
          <p className="text-white/50 text-xs">Paste a Pinterest board URL — e.g. pinterest.com/alekszpunt/bedroom/</p>
          <div className="flex gap-2">
            <input
              value={newUrl}
              onChange={(e) => setNewUrl(e.target.value)}
              placeholder="pinterest.com/alekszpunt/board-name/"
              className="flex-1 bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-sm text-white placeholder-white/25 outline-none focus:border-white/20"
            />
            <input
              value={newLabel}
              onChange={(e) => setNewLabel(e.target.value)}
              placeholder="Label"
              className="w-28 bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-sm text-white placeholder-white/25 outline-none focus:border-white/20"
            />
            <button onClick={addBoard} className="bg-red-500/20 border border-red-500/30 text-red-400 hover:bg-red-500/30 text-sm px-3 py-2 rounded-xl transition-colors">
              Add
            </button>
          </div>
        </div>
      )}

      {/* Board tabs */}
      <div className="flex gap-2 flex-wrap">
        {boards.map((b, i) => (
          <div key={i} className="flex items-center gap-1 group">
            <button
              onClick={() => setActive(i)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-colors ${
                active === i
                  ? "bg-red-500/20 border-red-500/30 text-red-400"
                  : "bg-white/5 border-white/8 text-white/40 hover:text-white/60"
              }`}
            >
              {b.label}
            </button>
            {i > 0 && (
              <button
                onClick={() => removeBoard(i)}
                className="text-white/20 hover:text-red-400 text-[10px] opacity-0 group-hover:opacity-100 transition-opacity"
              >
                ✕
              </button>
            )}
          </div>
        ))}
      </div>

      {/* Pinterest embed */}
      <div
        ref={containerRef}
        className="card p-4 min-h-64 overflow-hidden"
        key={current.url}
      >
        <a
          data-pin-do="embedUser"
          data-pin-board-width="250"
          data-pin-scale-height="300"
          data-pin-scale-width="60"
          href={current.url.startsWith("http") ? current.url : `https://${current.url}`}
        />
      </div>

      <p className="text-white/20 text-[10px] text-center">
        Showing live from{" "}
        <a href={current.url} target="_blank" rel="noopener noreferrer" className="text-red-400/60 hover:text-red-400">
          {current.url.replace("https://", "")}
        </a>
        {" "}· Updates automatically when you add pins
      </p>
    </div>
  );
}
