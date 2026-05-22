"use client";
import { useState, useEffect, useCallback } from "react";
import PinterestBoards from "./PinterestBoards";

type MoodboardItem = {
  id: string;
  url: string;
  imageUrl: string;
  title: string;
  project: string;
  notes: string;
  note: string;
  addedAt: string;
  source?: "pinterest" | "manual";
};

const defaultProjects = ["General", "Bedroom", "Living Room", "Kitchen", "Bathroom", "Office"];

export default function Moodboard() {
  const [items, setItems]                   = useState<MoodboardItem[]>([]);
  const [url, setUrl]                       = useState("");
  const [project, setProject]               = useState("General");
  const [notes, setNotes]                   = useState("");
  const [customProject, setCustomProject]   = useState("");
  const [showCustomProject, setShowCustomProject] = useState(false);
  const [syncing, setSyncing]               = useState(false);
  const [lastSync, setLastSync]             = useState<Date | null>(null);

  // Merge server items + localStorage, dedup by id
  const mergeItems = useCallback((local: MoodboardItem[], server: MoodboardItem[]) => {
    const map = new Map<string, MoodboardItem>();
    [...local, ...server].forEach((i) => map.set(i.id, i));
    return Array.from(map.values()).sort(
      (a, b) => new Date(b.addedAt).getTime() - new Date(a.addedAt).getTime()
    );
  }, []);

  // Fetch from server (KV)
  const fetchFromServer = useCallback(async () => {
    try {
      const res  = await fetch("/api/moodboard/items");
      const data = await res.json();
      if (data.items?.length) {
        setItems((prev) => {
          const merged = mergeItems(prev, data.items);
          localStorage.setItem("dashboard-moodboard", JSON.stringify(merged));
          return merged;
        });
        setLastSync(new Date());
      }
    } catch { /* silent */ }
  }, [mergeItems]);

  // Load localStorage first, then sync server
  useEffect(() => {
    const saved = localStorage.getItem("dashboard-moodboard");
    if (saved) {
      try { setItems(JSON.parse(saved)); } catch {}
    }
    fetchFromServer();
    // Poll every 30s to pick up new Pinterest pins automatically
    const interval = setInterval(fetchFromServer, 30000);
    return () => clearInterval(interval);
  }, [fetchFromServer]);

  const saveLocal = (next: MoodboardItem[]) => {
    setItems(next);
    localStorage.setItem("dashboard-moodboard", JSON.stringify(next));
  };

  const handleSync = async () => {
    setSyncing(true);
    await fetchFromServer();
    setSyncing(false);
  };

  const addItem = () => {
    if (!url.trim()) return;
    const finalProject = showCustomProject && customProject.trim() ? customProject.trim() : project;
    const newItem: MoodboardItem = {
      id: Date.now().toString(),
      url,
      imageUrl: url,
      title: "",
      project: finalProject,
      notes,
      note: notes,
      addedAt: new Date().toISOString(),
      source: "manual",
    };
    saveLocal([newItem, ...items]);
    setUrl(""); setNotes(""); setCustomProject(""); setShowCustomProject(false);
  };

  const removeItem = (id: string) => saveLocal(items.filter((i) => i.id !== id));

  const allProjects = Array.from(new Set(items.map((i) => i.project)));
  const groupedItems = allProjects.reduce((acc, proj) => {
    acc[proj] = items.filter((i) => i.project === proj);
    return acc;
  }, {} as Record<string, MoodboardItem[]>);

  return (
    <div className="space-y-6">

      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-white">Moodboard</h1>
          <p className="text-white/35 mt-1 text-sm">Design inspiration, organised by project.</p>
        </div>
        <button
          onClick={handleSync}
          className={`text-xs flex items-center gap-1.5 text-white/30 hover:text-white/60 transition-colors mt-1 ${syncing ? "animate-pulse" : ""}`}
        >
          ↻ {syncing ? "Syncing…" : lastSync ? `Synced ${lastSync.toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" })}` : "Sync"}
        </button>
      </div>

      {/* Pinterest Boards */}
      <PinterestBoards />

      {/* Add manually */}
      <div className="card p-5">
        <h2 className="text-white/70 text-xs font-semibold tracking-wide uppercase mb-3">Add manually</h2>
        <div className="space-y-3">
          <input
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            placeholder="Paste image or Pinterest URL…"
            className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2 text-sm text-white placeholder-white/25 outline-none focus:border-white/20 transition-colors"
          />
          <div className="flex gap-2">
            <select
              value={showCustomProject ? "custom" : project}
              onChange={(e) => {
                if (e.target.value === "custom") { setShowCustomProject(true); }
                else { setShowCustomProject(false); setProject(e.target.value); }
              }}
              className="bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-sm text-white/60 outline-none focus:border-white/20 transition-colors"
            >
              {defaultProjects.map((p) => <option key={p} value={p} className="bg-neutral-900">{p}</option>)}
              {allProjects.filter((p) => !defaultProjects.includes(p)).map((p) => (
                <option key={p} value={p} className="bg-neutral-900">{p}</option>
              ))}
              <option value="custom" className="bg-neutral-900">+ New project</option>
            </select>
            {showCustomProject && (
              <input
                value={customProject}
                onChange={(e) => setCustomProject(e.target.value)}
                placeholder="Project name…"
                className="flex-1 bg-white/5 border border-white/10 rounded-xl px-4 py-2 text-sm text-white placeholder-white/25 outline-none focus:border-white/20 transition-colors"
              />
            )}
          </div>
          <input
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Notes (optional)…"
            className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2 text-sm text-white placeholder-white/25 outline-none focus:border-white/20 transition-colors"
          />
          <button
            onClick={addItem}
            className="w-full bg-green-500/20 border border-green-500/30 text-green-400 hover:bg-green-500/30 text-sm font-medium px-4 py-2 rounded-xl transition-colors"
          >
            Add to Moodboard
          </button>
        </div>
      </div>

      {/* Empty state */}
      {allProjects.length === 0 && (
        <div className="card p-10 text-center">
          <p className="text-3xl mb-3">🎨</p>
          <p className="text-white/40 text-sm">No inspiration saved yet.</p>
          <p className="text-white/20 text-xs mt-1">Ask Claude Desktop to search Pinterest, or add a URL above.</p>
        </div>
      )}

      {/* Projects */}
      {allProjects.map((projectName) => (
        <div key={projectName} className="card p-5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-white font-semibold text-sm">{projectName}</h2>
            <span className="text-white/25 text-xs">{groupedItems[projectName].length} items</span>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
            {groupedItems[projectName].map((item) => {
              const imgSrc = item.imageUrl || item.url;
              const isImg = /\.(jpg|jpeg|png|gif|webp)/i.test(imgSrc) || imgSrc.includes("pinimg.com") || imgSrc.includes("i.pinimg");
              return (
                <div key={item.id} className="relative group">
                  <a
                    href={item.url || item.imageUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="block aspect-square rounded-xl overflow-hidden bg-white/5 hover:bg-white/8 transition-colors"
                  >
                    {isImg ? (
                      <img
                        src={imgSrc}
                        alt={item.title || item.notes || "Inspo"}
                        className="w-full h-full object-cover"
                        onError={(e) => {
                          (e.target as HTMLImageElement).style.display = "none";
                        }}
                      />
                    ) : (
                      <div className="w-full h-full flex flex-col items-center justify-center text-white/20 text-xs p-2 text-center gap-1">
                        <span className="text-xl">🔗</span>
                        <span className="break-all line-clamp-2">{item.url}</span>
                      </div>
                    )}
                    {item.source === "pinterest" && (
                      <div className="absolute top-2 left-2 bg-red-500/80 rounded-full w-5 h-5 flex items-center justify-center text-[9px]">📌</div>
                    )}
                  </a>
                  {(item.title || item.notes || item.note) && (
                    <p className="mt-1.5 text-white/40 text-[10px] line-clamp-1">{item.title || item.notes || item.note}</p>
                  )}
                  <button
                    onClick={() => removeItem(item.id)}
                    className="absolute top-2 right-2 w-6 h-6 rounded-full bg-black/60 text-white/50 hover:text-red-400 text-xs opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center"
                  >
                    ✕
                  </button>
                </div>
              );
            })}
          </div>
        </div>
      ))}
    </div>
  );
}
