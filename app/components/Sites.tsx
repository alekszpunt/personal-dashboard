"use client";
import { useState, useEffect } from "react";

type Site = {
  id: string;
  url: string;
  title: string;
  note: string;
  tag: string;
  addedAt: string;
  favicon: string;
};

const TAGS = ["All", "Design", "Dev", "Inspo", "Shopping", "Reading", "Tools", "Other"];

const tagColors: Record<string, string> = {
  "Design":   "text-pink-400   bg-pink-400/10   border-pink-400/20",
  "Dev":      "text-blue-400   bg-blue-400/10   border-blue-400/20",
  "Inspo":    "text-purple-400 bg-purple-400/10 border-purple-400/20",
  "Shopping": "text-yellow-400 bg-yellow-400/10 border-yellow-400/20",
  "Reading":  "text-green-400  bg-green-400/10  border-green-400/20",
  "Tools":    "text-orange-400 bg-orange-400/10 border-orange-400/20",
  "Other":    "text-white/40   bg-white/5       border-white/10",
};

function getFavicon(url: string) {
  try {
    const { hostname } = new URL(url.startsWith("http") ? url : `https://${url}`);
    return `https://www.google.com/s2/favicons?domain=${hostname}&sz=32`;
  } catch {
    return "";
  }
}

function cleanUrl(url: string) {
  return url.startsWith("http") ? url : `https://${url}`;
}

function displayUrl(url: string) {
  try {
    return new URL(cleanUrl(url)).hostname.replace("www.", "");
  } catch {
    return url;
  }
}

export default function Sites() {
  const [sites, setSites]       = useState<Site[]>([]);
  const [filter, setFilter]     = useState("All");
  const [search, setSearch]     = useState("");
  const [showAdd, setShowAdd]   = useState(false);
  const [editId, setEditId]     = useState<string | null>(null);

  const [form, setForm] = useState({ url: "", title: "", note: "", tag: "Other" });

  useEffect(() => {
    const saved = localStorage.getItem("dashboard-sites");
    if (saved) { try { setSites(JSON.parse(saved)); } catch {} }
  }, []);

  const save = (next: Site[]) => {
    setSites(next);
    localStorage.setItem("dashboard-sites", JSON.stringify(next));
  };

  const handleAdd = () => {
    if (!form.url.trim()) return;
    const url = cleanUrl(form.url.trim());
    const title = form.title.trim() || displayUrl(url);
    if (editId) {
      save(sites.map((s) => s.id === editId ? { ...s, url, title, note: form.note, tag: form.tag } : s));
      setEditId(null);
    } else {
      const newSite: Site = {
        id: Date.now().toString(),
        url,
        title,
        note: form.note,
        tag: form.tag,
        addedAt: new Date().toISOString(),
        favicon: getFavicon(url),
      };
      save([newSite, ...sites]);
    }
    setForm({ url: "", title: "", note: "", tag: "Other" });
    setShowAdd(false);
  };

  const handleEdit = (site: Site) => {
    setForm({ url: site.url, title: site.title, note: site.note, tag: site.tag });
    setEditId(site.id);
    setShowAdd(true);
  };

  const handleDelete = (id: string) => {
    save(sites.filter((s) => s.id !== id));
  };

  const handleCancel = () => {
    setForm({ url: "", title: "", note: "", tag: "Other" });
    setEditId(null);
    setShowAdd(false);
  };

  const filtered = sites.filter((s) => {
    const matchTag    = filter === "All" || s.tag === filter;
    const matchSearch = !search || s.title.toLowerCase().includes(search.toLowerCase()) || s.url.toLowerCase().includes(search.toLowerCase());
    return matchTag && matchSearch;
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-white">Saved Sites</h1>
          <p className="text-white/35 mt-1 text-sm">Websites you love, all in one place.</p>
        </div>
        <button
          onClick={() => { setShowAdd(!showAdd); if (showAdd) handleCancel(); }}
          className="text-xs bg-green-500/20 border border-green-500/30 text-green-400 hover:bg-green-500/30 px-3 py-2 rounded-xl transition-colors"
        >
          + Add site
        </button>
      </div>

      {/* Add / Edit form */}
      {showAdd && (
        <div className="card p-5 space-y-3">
          <h2 className="text-white/80 text-sm font-medium">{editId ? "Edit site" : "Add a site"}</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <input
              type="text"
              placeholder="URL — e.g. notion.so"
              value={form.url}
              onChange={(e) => setForm({ ...form, url: e.target.value })}
              className="bg-white/5 border border-white/10 rounded-xl px-4 py-2 text-sm text-white placeholder-white/25 outline-none focus:border-white/20 transition-colors"
            />
            <input
              type="text"
              placeholder="Title (optional)"
              value={form.title}
              onChange={(e) => setForm({ ...form, title: e.target.value })}
              className="bg-white/5 border border-white/10 rounded-xl px-4 py-2 text-sm text-white placeholder-white/25 outline-none focus:border-white/20 transition-colors"
            />
            <input
              type="text"
              placeholder="Note (optional)"
              value={form.note}
              onChange={(e) => setForm({ ...form, note: e.target.value })}
              className="bg-white/5 border border-white/10 rounded-xl px-4 py-2 text-sm text-white placeholder-white/25 outline-none focus:border-white/20 transition-colors"
            />
            <select
              value={form.tag}
              onChange={(e) => setForm({ ...form, tag: e.target.value })}
              className="bg-white/5 border border-white/10 rounded-xl px-4 py-2 text-sm text-white/70 outline-none focus:border-white/20 transition-colors"
            >
              {TAGS.filter((t) => t !== "All").map((t) => (
                <option key={t} value={t} className="bg-neutral-900">{t}</option>
              ))}
            </select>
          </div>
          <div className="flex gap-2 pt-1">
            <button
              onClick={handleAdd}
              className="bg-green-500/20 border border-green-500/30 text-green-400 hover:bg-green-500/30 text-sm px-4 py-2 rounded-xl transition-colors"
            >
              {editId ? "Save changes" : "Save site"}
            </button>
            <button
              onClick={handleCancel}
              className="text-white/30 hover:text-white/60 text-sm px-4 py-2 rounded-xl transition-colors"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* Search + tag filter */}
      <div className="flex flex-col sm:flex-row gap-3">
        <input
          type="text"
          placeholder="Search saved sites…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="flex-1 bg-white/5 border border-white/10 rounded-xl px-4 py-2 text-sm text-white placeholder-white/25 outline-none focus:border-white/20 transition-colors"
        />
        <div className="flex gap-1.5 flex-wrap">
          {TAGS.map((tag) => (
            <button
              key={tag}
              onClick={() => setFilter(tag)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-colors ${
                filter === tag
                  ? "bg-green-500/20 border-green-500/30 text-green-400"
                  : "bg-white/5 border-white/8 text-white/40 hover:text-white/60"
              }`}
            >
              {tag}
            </button>
          ))}
        </div>
      </div>

      {/* Count */}
      {sites.length > 0 && (
        <p className="text-white/25 text-xs">{filtered.length} site{filtered.length !== 1 ? "s" : ""}{filter !== "All" ? ` in ${filter}` : ""}</p>
      )}

      {/* Grid */}
      {filtered.length === 0 && sites.length === 0 ? (
        <div className="card p-10 text-center">
          <p className="text-3xl mb-3">🔖</p>
          <p className="text-white/40 text-sm">No saved sites yet.</p>
          <p className="text-white/20 text-xs mt-1">Hit "+ Add site" to save your first one.</p>
        </div>
      ) : filtered.length === 0 ? (
        <div className="card p-6 text-center">
          <p className="text-white/30 text-sm">No sites match.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {filtered.map((site) => {
            const tc = tagColors[site.tag] ?? tagColors["Other"];
            return (
              <div
                key={site.id}
                className="card p-4 flex flex-col gap-2 hover:border-white/14 transition-colors group"
              >
                {/* Favicon + title row */}
                <div className="flex items-start gap-2.5">
                  {site.favicon && (
                    <img
                      src={site.favicon}
                      alt=""
                      className="w-5 h-5 rounded mt-0.5 shrink-0 opacity-80"
                      onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }}
                    />
                  )}
                  <div className="flex-1 min-w-0">
                    <a
                      href={site.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-white/85 text-sm font-medium group-hover:text-white transition-colors line-clamp-2 no-underline"
                    >
                      {site.title}
                    </a>
                    <p className="text-white/25 text-[10px] truncate mt-0.5">{displayUrl(site.url)}</p>
                  </div>
                </div>

                {/* Note */}
                {site.note && (
                  <p className="text-white/40 text-[11px] leading-relaxed line-clamp-2">{site.note}</p>
                )}

                {/* Footer */}
                <div className="mt-auto pt-1 flex items-center justify-between gap-2">
                  <span className={`text-[10px] font-medium px-2 py-0.5 rounded-full border ${tc}`}>
                    {site.tag}
                  </span>
                  <div className="flex gap-2">
                    <button
                      onClick={() => handleEdit(site)}
                      className="text-white/20 hover:text-white/50 text-[11px] transition-colors"
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => handleDelete(site.id)}
                      className="text-white/20 hover:text-red-400 text-[11px] transition-colors"
                    >
                      ✕
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
