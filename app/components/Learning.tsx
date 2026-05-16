"use client";
import { useState, useEffect } from "react";

const courses = [
  { id: 1, name: "Interior Design Diploma", category: "Design", progress: 50, notes: "1 year remaining. £350/month. Worth finishing." },
  { id: 2, name: "AI Prompting & Image Models", category: "AI", progress: 40, notes: "Self-taught. Midjourney, Higgsfield. Keep building." },
  { id: 3, name: "Money & Investing Basics", category: "Finance", progress: 5, notes: "Starting now. ISA, index funds, compound interest." },
];

const categoryColors: Record<string, string> = {
  Design: "text-purple-400 bg-purple-400/10 border-purple-400/20",
  AI: "text-blue-400 bg-blue-400/10 border-blue-400/20",
  Finance: "text-green-400 bg-green-400/10 border-green-400/20",
};

type VideoLesson = {
  id: string;
  title: string;
  category: string;
  summary: string;
  keyTakeaways: string[];
  actionItems: string[];
  url: string;
  addedAt: string;
  status: "saved" | "watching" | "practicing" | "applied";
};

export default function Learning() {
  const [inspiration, setInspiration] = useState("");
  const [videos, setVideos] = useState<VideoLesson[]>([]);
  const [processing, setProcessing] = useState(false);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  // Load from localStorage
  useEffect(() => {
    const saved = localStorage.getItem("dashboard-videos");
    if (saved) {
      try {
        setVideos(JSON.parse(saved));
      } catch (e) {
        console.error("Failed to parse saved videos", e);
      }
    }
  }, []);

  // Save to localStorage
  useEffect(() => {
    localStorage.setItem("dashboard-videos", JSON.stringify(videos));
  }, [videos]);

  const add = async () => {
    if (!inspiration.trim()) return;
    
    setProcessing(true);
    try {
      const response = await fetch("/api/learning/process-video", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url: inspiration }),
      });
      
      const data = await response.json();
      
      const newVideo: VideoLesson = {
        id: Date.now().toString(),
        ...data,
      };
      
      setVideos([newVideo, ...videos]);
      setInspiration("");
      setExpandedId(newVideo.id); // Auto-expand the new video
    } catch (err) {
      console.error("Failed to process video:", err);
      alert("Failed to process video. Check console for details.");
    } finally {
      setProcessing(false);
    }
  };

  const updateStatus = (id: string, status: VideoLesson["status"]) => {
    setVideos(videos.map((v) => (v.id === id ? { ...v, status } : v)));
  };

  const remove = (id: string) => {
    setVideos(videos.filter((v) => v.id !== id));
  };

  const statusColors = {
    saved: "text-white/40 bg-white/5 border-white/10",
    watching: "text-blue-400 bg-blue-400/10 border-blue-400/20",
    practicing: "text-yellow-400 bg-yellow-400/10 border-yellow-400/20",
    applied: "text-green-400 bg-green-400/10 border-green-400/20",
  };

  const categories = Array.from(new Set(videos.map((v) => v.category)));
  const groupedVideos = categories.reduce((acc, cat) => {
    acc[cat] = videos.filter((v) => v.category === cat);
    return acc;
  }, {} as Record<string, VideoLesson[]>);

  return (
    <div className="space-y-4">

      <div className="glass p-5">
        <h2 className="text-white font-semibold text-sm uppercase tracking-wide mb-5">Courses & Learning</h2>
        <div className="space-y-5">
          {courses.map((c) => (
            <div key={c.id}>
              <div className="flex items-center justify-between mb-2">
                <span className="text-white/80 text-sm font-medium">{c.name}</span>
                <span className={`text-xs px-2 py-0.5 rounded-full border ${categoryColors[c.category] || "text-white/40 bg-white/5 border-white/10"}`}>{c.category}</span>
              </div>
              <div className="w-full bg-white/5 rounded-full h-1.5 mb-1">
                <div className="bg-green-400 h-1.5 rounded-full transition-all" style={{ width: `${c.progress}%` }} />
              </div>
              <div className="flex justify-between text-xs text-white/30">
                <span>{c.notes}</span>
                <span>{c.progress}%</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="glass p-5">
        <h2 className="text-white font-semibold text-sm uppercase tracking-wide mb-1">Learn from Videos</h2>
        <p className="text-white/30 text-xs mb-4">Paste an Instagram or YouTube link. AI will extract lessons and action items.</p>
        <div className="flex gap-2">
          <input
            value={inspiration}
            onChange={(e) => setInspiration(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && !processing && add()}
            placeholder="Paste video URL..."
            disabled={processing}
            className="flex-1 glass-input text-white text-sm px-4 py-2 outline-none placeholder:text-white/20 bg-transparent disabled:opacity-50"
          />
          <button 
            onClick={add} 
            disabled={processing}
            className="glass-pill-active text-black text-sm font-medium px-4 py-2 rounded-xl disabled:opacity-50"
          >
            {processing ? "Processing..." : "Add"}
          </button>
        </div>
      </div>

      {categories.length > 0 && categories.map((category) => (
        <div key={category} className="glass p-5">
          <h2 className="text-white font-semibold text-sm uppercase tracking-wide mb-4">{category}</h2>
          <div className="space-y-3">
            {groupedVideos[category].map((video) => (
              <div key={video.id} className="border border-white/10 rounded-lg p-3">
                <div className="flex items-start justify-between mb-2">
                  <div className="flex-1">
                    <button
                      onClick={() => setExpandedId(expandedId === video.id ? null : video.id)}
                      className="text-white/80 text-sm font-medium hover:text-white text-left w-full"
                    >
                      {video.title}
                    </button>
                    <div className="flex gap-3 mt-1">
                      <a 
                        href={video.url} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="text-xs text-white/20 hover:text-white/40"
                      >
                        View original →
                      </a>
                      <button
                        onClick={() => {
                          const message = `Let's discuss this video I want to learn from:\n\nTitle: ${video.title}\nCategory: ${video.category}\nURL: ${video.url}\n\nSummary: ${video.summary}\n\nKey points:\n${video.keyTakeaways.map((t, i) => `${i + 1}. ${t}`).join('\n')}\n\nCan you help me understand this better and figure out how to apply it?`;
                          navigator.clipboard.writeText(message);
                          alert('Copied to clipboard! Paste this in your chat with Fred.');
                        }}
                        className="text-xs text-blue-400 hover:text-blue-300"
                      >
                        💬 Discuss with Fred
                      </button>
                    </div>
                  </div>
                  <button
                    onClick={() => remove(video.id)}
                    className="text-white/20 hover:text-red-400 text-xs ml-2"
                  >
                    ✕
                  </button>
                </div>

                <div className="flex gap-2 mb-2">
                  {(["saved", "watching", "practicing", "applied"] as const).map((s) => (
                    <button
                      key={s}
                      onClick={() => updateStatus(video.id, s)}
                      className={`text-xs px-2 py-1 rounded-full border transition-all ${
                        video.status === s ? statusColors[s] : "text-white/30 bg-transparent border-white/10 hover:border-white/20"
                      }`}
                    >
                      {s}
                    </button>
                  ))}
                </div>

                {expandedId === video.id && (
                  <div className="mt-3 space-y-3 text-sm">
                    <div>
                      <div className="text-white/40 text-xs uppercase tracking-wide mb-1">Summary</div>
                      <p className="text-white/60">{video.summary}</p>
                    </div>
                    
                    <div>
                      <div className="text-white/40 text-xs uppercase tracking-wide mb-1">Key Takeaways</div>
                      <ul className="space-y-1">
                        {video.keyTakeaways.map((item, i) => (
                          <li key={i} className="text-white/60 text-xs flex items-start gap-2">
                            <span className="text-green-400 mt-0.5">•</span>
                            <span>{item}</span>
                          </li>
                        ))}
                      </ul>
                    </div>

                    <div>
                      <div className="text-white/40 text-xs uppercase tracking-wide mb-1">Action Items</div>
                      <ul className="space-y-1">
                        {video.actionItems.map((item, i) => (
                          <li key={i} className="text-white/60 text-xs flex items-start gap-2">
                            <span className="text-yellow-400 mt-0.5">→</span>
                            <span>{item}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      ))

    </div>
  );
}
