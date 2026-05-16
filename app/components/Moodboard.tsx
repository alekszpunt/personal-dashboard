"use client";
import { useState, useEffect } from "react";

type MoodboardItem = {
  id: string;
  url: string;
  imageUrl: string;
  project: string;
  notes: string;
  addedAt: string;
};

export default function Moodboard() {
  const [items, setItems] = useState<MoodboardItem[]>([]);
  const [url, setUrl] = useState("");
  const [project, setProject] = useState("General");
  const [notes, setNotes] = useState("");
  const [customProject, setCustomProject] = useState("");
  const [showCustomProject, setShowCustomProject] = useState(false);

  // Load from localStorage
  useEffect(() => {
    const saved = localStorage.getItem("dashboard-moodboard");
    if (saved) {
      try {
        setItems(JSON.parse(saved));
      } catch (e) {
        console.error("Failed to parse saved moodboard", e);
      }
    }
  }, []);

  // Save to localStorage
  useEffect(() => {
    localStorage.setItem("dashboard-moodboard", JSON.stringify(items));
  }, [items]);

  const addItem = () => {
    if (!url.trim()) return;

    const finalProject = showCustomProject && customProject.trim() 
      ? customProject.trim() 
      : project;

    // Try to extract image URL from various sources
    let imageUrl = url;
    
    // For Pinterest, Instagram, etc - for now just use the URL
    // Later we can add proper thumbnail extraction
    
    const newItem: MoodboardItem = {
      id: Date.now().toString(),
      url,
      imageUrl,
      project: finalProject,
      notes,
      addedAt: new Date().toISOString(),
    };

    setItems([newItem, ...items]);
    setUrl("");
    setNotes("");
    setCustomProject("");
    setShowCustomProject(false);
  };

  const removeItem = (id: string) => {
    setItems(items.filter((i) => i.id !== id));
  };

  const projects = Array.from(new Set(items.map((i) => i.project)));
  const groupedItems = projects.reduce((acc, proj) => {
    acc[proj] = items.filter((i) => i.project === proj);
    return acc;
  }, {} as Record<string, MoodboardItem[]>);

  const defaultProjects = ["General", "Bedroom", "Living Room", "Kitchen", "Bathroom", "Office"];

  return (
    <div className="space-y-4">
      
      <div className="glass p-5">
        <h2 className="text-white font-semibold text-sm uppercase tracking-wide mb-1">Add to Moodboard</h2>
        <p className="text-white/30 text-xs mb-4">Save design inspiration from Pinterest, Instagram, or anywhere.</p>
        
        <div className="space-y-3">
          <input
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            placeholder="Paste image or Pinterest URL..."
            className="w-full glass-input text-white text-sm px-4 py-2 outline-none placeholder:text-white/20 bg-transparent"
          />

          <div className="flex gap-2 items-center">
            <select
              value={showCustomProject ? "custom" : project}
              onChange={(e) => {
                if (e.target.value === "custom") {
                  setShowCustomProject(true);
                } else {
                  setShowCustomProject(false);
                  setProject(e.target.value);
                }
              }}
              className="glass-input text-white/60 text-sm px-3 py-2 outline-none bg-transparent"
            >
              {defaultProjects.map((p) => (
                <option key={p} value={p}>{p}</option>
              ))}
              <option value="custom">+ New Project</option>
            </select>

            {showCustomProject && (
              <input
                value={customProject}
                onChange={(e) => setCustomProject(e.target.value)}
                placeholder="Project name..."
                className="flex-1 glass-input text-white text-sm px-4 py-2 outline-none placeholder:text-white/20 bg-transparent"
              />
            )}
          </div>

          <input
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Notes (optional)..."
            className="w-full glass-input text-white text-sm px-4 py-2 outline-none placeholder:text-white/20 bg-transparent"
          />

          <button 
            onClick={addItem}
            className="w-full glass-pill-active text-black text-sm font-medium px-4 py-2 rounded-xl hover:opacity-90 transition-opacity"
          >
            Add to Moodboard
          </button>
        </div>
      </div>

      {projects.length === 0 && (
        <div className="glass p-8 text-center">
          <p className="text-white/30 text-sm">No inspiration saved yet. Start adding images above!</p>
        </div>
      )}

      {projects.map((projectName) => (
        <div key={projectName} className="glass p-5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-white font-semibold text-sm uppercase tracking-wide">{projectName}</h2>
            <span className="text-white/30 text-xs">{groupedItems[projectName].length} items</span>
          </div>

          <div className="grid grid-cols-2 gap-3">
            {groupedItems[projectName].map((item) => (
              <div key={item.id} className="relative group">
                <a 
                  href={item.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="block aspect-square rounded-lg overflow-hidden bg-white/5 hover:bg-white/10 transition-colors"
                >
                  {item.imageUrl.match(/\.(jpg|jpeg|png|gif|webp)$/i) ? (
                    <img 
                      src={item.imageUrl} 
                      alt={item.notes || "Inspiration"}
                      className="w-full h-full object-cover"
                      onError={(e) => {
                        // Fallback if image doesn't load
                        (e.target as HTMLImageElement).style.display = 'none';
                        (e.target as HTMLImageElement).parentElement!.innerHTML = 
                          '<div class="w-full h-full flex items-center justify-center text-white/20 text-xs">🖼️<br/>Image</div>';
                      }}
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-white/20 text-xs p-2 text-center break-all">
                      🔗<br/>{new URL(item.url).hostname}
                    </div>
                  )}
                </a>

                <button
                  onClick={() => removeItem(item.id)}
                  className="absolute top-2 right-2 w-6 h-6 rounded-full bg-black/60 text-white/60 hover:text-red-400 text-xs opacity-0 group-hover:opacity-100 transition-opacity"
                >
                  ✕
                </button>

                {item.notes && (
                  <div className="mt-2 text-xs text-white/40 line-clamp-2">{item.notes}</div>
                )}
              </div>
            ))}
          </div>
        </div>
      ))}

    </div>
  );
}
