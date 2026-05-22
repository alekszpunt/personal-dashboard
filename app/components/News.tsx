"use client";
import { useState, useEffect, useCallback } from "react";

type NewsItem = {
  id: string;
  title: string;
  summary: string;
  source: string;
  url: string;
  publishedAt: string;
  category: string;
};

const CATEGORIES = ["All", "Top Stories", "Technology", "Business", "UK"];

const categoryColors: Record<string, string> = {
  "Top Stories": "text-green-400  bg-green-400/10  border-green-400/20",
  "Technology":  "text-blue-400   bg-blue-400/10   border-blue-400/20",
  "Business":    "text-yellow-400 bg-yellow-400/10 border-yellow-400/20",
  "UK":          "text-purple-400 bg-purple-400/10 border-purple-400/20",
};

function timeAgo(iso: string) {
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  return `${Math.floor(hrs / 24)}d ago`;
}

export default function News() {
  const [articles, setArticles] = useState<NewsItem[]>([]);
  const [loading, setLoading]   = useState(true);
  const [error, setError]       = useState("");
  const [filter, setFilter]     = useState("All");
  const [search, setSearch]     = useState("");

  const fetchNews = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const res  = await fetch("/api/news");
      const data = await res.json();
      if (data.articles) setArticles(data.articles);
      else setError("Could not load news.");
    } catch {
      setError("Could not load news.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchNews(); }, [fetchNews]);

  const filtered = articles.filter((a) => {
    const matchCat    = filter === "All" || a.category === filter;
    const matchSearch = !search || a.title.toLowerCase().includes(search.toLowerCase());
    return matchCat && matchSearch;
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-white">News</h1>
          <p className="text-white/35 mt-1 text-sm">Latest headlines from BBC &amp; The Guardian.</p>
        </div>
        <button
          onClick={fetchNews}
          className="text-white/30 hover:text-white/60 text-xs transition-colors mt-1"
        >
          ↻ Refresh
        </button>
      </div>

      {/* Search + filter row */}
      <div className="flex flex-col sm:flex-row gap-3">
        <input
          type="text"
          placeholder="Search headlines…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="flex-1 bg-white/5 border border-white/10 rounded-xl px-4 py-2 text-sm text-white placeholder-white/25 outline-none focus:border-white/20 transition-colors"
        />
        <div className="flex gap-1.5 flex-wrap">
          {CATEGORIES.map((cat) => (
            <button
              key={cat}
              onClick={() => setFilter(cat)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-colors ${
                filter === cat
                  ? "bg-green-500/20 border-green-500/30 text-green-400"
                  : "bg-white/5 border-white/8 text-white/40 hover:text-white/60"
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {/* Articles */}
      {loading ? (
        <div className="space-y-3">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="card p-4 animate-pulse">
              <div className="h-3 bg-white/8 rounded w-3/4 mb-2" />
              <div className="h-2 bg-white/5 rounded w-full mb-1" />
              <div className="h-2 bg-white/5 rounded w-2/3" />
            </div>
          ))}
        </div>
      ) : error ? (
        <div className="card p-6 text-center">
          <p className="text-white/40 text-sm">{error}</p>
          <button onClick={fetchNews} className="text-green-400 text-xs mt-3 hover:text-green-300">Try again</button>
        </div>
      ) : filtered.length === 0 ? (
        <div className="card p-6 text-center">
          <p className="text-white/30 text-sm">No articles found.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map((article) => {
            const catColor = categoryColors[article.category] ?? "text-white/40 bg-white/5 border-white/10";
            return (
              <a
                key={article.id}
                href={article.url}
                target="_blank"
                rel="noopener noreferrer"
                className="card p-4 flex flex-col gap-2 hover:border-white/14 transition-colors group no-underline"
              >
                {/* Category + time */}
                <div className="flex items-center justify-between gap-2">
                  <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full border ${catColor}`}>
                    {article.category}
                  </span>
                  <span className="text-white/25 text-[10px] shrink-0">{timeAgo(article.publishedAt)}</span>
                </div>

                {/* Title */}
                <h3 className="text-white/85 text-sm font-medium leading-snug group-hover:text-white transition-colors line-clamp-3">
                  {article.title}
                </h3>

                {/* Summary */}
                {article.summary && (
                  <p className="text-white/35 text-[11px] leading-relaxed line-clamp-2">{article.summary}</p>
                )}

                {/* Source */}
                <div className="mt-auto pt-1 flex items-center justify-between">
                  <span className="text-white/25 text-[10px]">{article.source}</span>
                  <span className="text-green-400/60 text-[10px] group-hover:text-green-400 transition-colors">Read →</span>
                </div>
              </a>
            );
          })}
        </div>
      )}
    </div>
  );
}
