"use client";
import { useEffect, useRef, useState } from "react";

export type WishlistItem = {
  id: string;
  url: string;
  title: string;
  price: number; // numeric, GBP
  image?: string;
  description?: string;
  notes?: string;
  savedAt: string; // ISO
  priority: "high" | "med" | "low";
};

const LS_KEY = "dashboard-wishlist";

function loadItems(): WishlistItem[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(LS_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function saveItems(items: WishlistItem[]) {
  localStorage.setItem(LS_KEY, JSON.stringify(items));
}

const PRIORITY_META: Record<
  WishlistItem["priority"],
  { label: string; bg: string; text: string }
> = {
  high: { label: "High", bg: "bg-red-500/20", text: "text-red-400" },
  med:  { label: "Med",  bg: "bg-yellow-500/20", text: "text-yellow-400" },
  low:  { label: "Low",  bg: "bg-white/10", text: "text-white/40" },
};

const PRIORITY_ORDER: WishlistItem["priority"][] = ["high", "med", "low"];

function nextPriority(p: WishlistItem["priority"]): WishlistItem["priority"] {
  const idx = PRIORITY_ORDER.indexOf(p);
  return PRIORITY_ORDER[(idx + 1) % PRIORITY_ORDER.length];
}

function KlarnaWidget({ price }: { price: number }) {
  const [open, setOpen] = useState(false);
  const pay30 = price.toFixed(2);
  const pay3 = (price / 3).toFixed(2);
  const pay6 = ((price * 1.09) / 6).toFixed(2);
  const pay12 = ((price * 1.18) / 12).toFixed(2);

  return (
    <div className="mt-3">
      <button
        onClick={() => setOpen((o) => !o)}
        className="text-xs text-pink-300/70 hover:text-pink-200 transition-colors flex items-center gap-1"
      >
        <span>Pay with Klarna</span>
        <span className="text-[10px]">{open ? "▴" : "▾"}</span>
      </button>
      {open && (
        <div className="mt-2 rounded-xl bg-pink-500/10 border border-pink-500/20 p-3 space-y-1.5">
          <p className="text-[10px] uppercase tracking-widest text-pink-300/50 mb-2">Payment options</p>
          <KlarnaRow label="Pay in 30 days" value={`£${pay30}`} />
          <KlarnaRow label="3 payments" value={`£${pay3}/mo`} />
          <KlarnaRow label="6-month financing" value={`£${pay6}/mo`} sub="~18% APR" />
          <KlarnaRow label="12-month financing" value={`£${pay12}/mo`} sub="~18% APR" />
        </div>
      )}
    </div>
  );
}

function KlarnaRow({ label, value, sub }: { label: string; value: string; sub?: string }) {
  return (
    <div className="flex justify-between items-baseline">
      <span className="text-pink-200/60 text-xs">
        {label}
        {sub && <span className="text-pink-200/30 ml-1 text-[10px]">{sub}</span>}
      </span>
      <span className="text-pink-200/90 text-xs font-medium">{value}</span>
    </div>
  );
}

type ScrapeResult = {
  title?: string | null;
  price?: number | null;
  image?: string | null;
  description?: string | null;
  url?: string;
  source?: string;
  error?: string;
};

export default function Wishlist() {
  const [items, setItems] = useState<WishlistItem[]>([]);
  const [urlInput, setUrlInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [scrapeError, setScrapeError] = useState("");

  // Manual entry fallback state
  const [showManual, setShowManual] = useState(false);
  const [pendingUrl, setPendingUrl] = useState("");
  const [manualTitle, setManualTitle] = useState("");
  const [manualPrice, setManualPrice] = useState("");
  const [manualImage, setManualImage] = useState("");

  // Notes editing
  const [editingNotesId, setEditingNotesId] = useState<string | null>(null);
  const [notesValue, setNotesValue] = useState("");
  const notesRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    setItems(loadItems());
  }, []);

  const persistItems = (updated: WishlistItem[]) => {
    setItems(updated);
    saveItems(updated);
  };

  const handleAdd = async () => {
    const trimmed = urlInput.trim();
    if (!trimmed) return;
    setLoading(true);
    setScrapeError("");
    setShowManual(false);

    try {
      const res = await fetch("/api/wishlist/scrape", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url: trimmed }),
      });
      const data: ScrapeResult = await res.json();

      if (data.error || (!data.title && !data.price)) {
        // Scraping failed — show manual form
        setPendingUrl(trimmed);
        setManualTitle(data.title ?? "");
        setManualPrice(data.price != null ? String(data.price) : "");
        setManualImage(data.image ?? "");
        setShowManual(true);
        setScrapeError(data.error ? `Couldn't auto-fill: ${data.error}` : "Couldn't extract details — fill them in manually.");
        return;
      }

      const newItem: WishlistItem = {
        id: crypto.randomUUID(),
        url: trimmed,
        title: data.title ?? trimmed,
        price: data.price ?? 0,
        image: data.image ?? undefined,
        description: data.description ?? undefined,
        savedAt: new Date().toISOString(),
        priority: "med",
      };

      persistItems([newItem, ...items]);
      setUrlInput("");
    } catch (err) {
      setScrapeError("Network error. Fill in manually.");
      setPendingUrl(trimmed);
      setShowManual(true);
    } finally {
      setLoading(false);
    }
  };

  const handleManualAdd = () => {
    const price = parseFloat(manualPrice);
    if (!manualTitle.trim() || isNaN(price)) return;
    const newItem: WishlistItem = {
      id: crypto.randomUUID(),
      url: pendingUrl,
      title: manualTitle.trim(),
      price,
      image: manualImage.trim() || undefined,
      savedAt: new Date().toISOString(),
      priority: "med",
    };
    persistItems([newItem, ...items]);
    setShowManual(false);
    setScrapeError("");
    setUrlInput("");
    setPendingUrl("");
    setManualTitle("");
    setManualPrice("");
    setManualImage("");
  };

  const deleteItem = (id: string) => {
    persistItems(items.filter((i) => i.id !== id));
  };

  const togglePriority = (id: string) => {
    persistItems(
      items.map((i) =>
        i.id === id ? { ...i, priority: nextPriority(i.priority) } : i
      )
    );
  };

  const startEditNotes = (item: WishlistItem) => {
    setEditingNotesId(item.id);
    setNotesValue(item.notes ?? "");
    setTimeout(() => notesRef.current?.focus(), 50);
  };

  const saveNotes = (id: string) => {
    persistItems(
      items.map((i) => (i.id === id ? { ...i, notes: notesValue } : i))
    );
    setEditingNotesId(null);
  };

  const totalValue = items.reduce((a, b) => a + b.price, 0);

  return (
    <div className="space-y-5">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Wishlist 🛍️</h1>
        <p className="text-white/35 text-sm mt-0.5">
          {items.length > 0
            ? `${items.length} item${items.length !== 1 ? "s" : ""} · £${totalValue.toFixed(2)} total`
            : "Paste a URL to add something you want."}
        </p>
      </div>

      {/* URL input bar */}
      <div className="card p-4">
        <div className="flex gap-2">
          <input
            type="url"
            value={urlInput}
            onChange={(e) => setUrlInput(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && !loading && handleAdd()}
            placeholder="Paste a product URL…"
            className="field flex-1 px-3 py-2.5 text-white text-sm"
            disabled={loading}
          />
          <button
            onClick={handleAdd}
            disabled={loading || !urlInput.trim()}
            className="btn-primary text-sm px-5 py-2.5 shrink-0"
          >
            {loading ? "Loading…" : "Add"}
          </button>
        </div>
        {scrapeError && (
          <p className="text-yellow-400/70 text-xs mt-2">{scrapeError}</p>
        )}
      </div>

      {/* Manual entry form */}
      {showManual && (
        <div className="card p-4 border-yellow-500/20 space-y-3">
          <p className="text-white/50 text-xs font-medium uppercase tracking-widest">
            Manual Entry
          </p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div>
              <label className="stat-label block mb-1">Title *</label>
              <input
                type="text"
                value={manualTitle}
                onChange={(e) => setManualTitle(e.target.value)}
                placeholder="Product name"
                className="field w-full px-3 py-2 text-white text-sm"
              />
            </div>
            <div>
              <label className="stat-label block mb-1">Price (£) *</label>
              <input
                type="number"
                step="0.01"
                min="0"
                value={manualPrice}
                onChange={(e) => setManualPrice(e.target.value)}
                placeholder="0.00"
                className="field w-full px-3 py-2 text-white text-sm"
              />
            </div>
          </div>
          <div>
            <label className="stat-label block mb-1">Image URL (optional)</label>
            <input
              type="url"
              value={manualImage}
              onChange={(e) => setManualImage(e.target.value)}
              placeholder="https://…"
              className="field w-full px-3 py-2 text-white text-sm"
            />
          </div>
          <div className="flex gap-2">
            <button
              onClick={handleManualAdd}
              className="btn-primary text-sm px-4 py-2"
            >
              Add to wishlist
            </button>
            <button
              onClick={() => { setShowManual(false); setScrapeError(""); }}
              className="btn-ghost text-sm px-4 py-2"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* Empty state */}
      {items.length === 0 && !showManual && (
        <div className="card p-12 text-center">
          <p className="text-5xl mb-4">🛍️</p>
          <p className="text-white/40 text-base font-medium">Nothing here yet!</p>
          <p className="text-white/20 text-sm mt-2">
            Paste a product URL above and hit Add to start your wishlist.
          </p>
        </div>
      )}

      {/* Product grid */}
      {items.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {items.map((item) => {
            const pm = PRIORITY_META[item.priority];
            const isEditingNotes = editingNotesId === item.id;

            return (
              <div key={item.id} className="card flex flex-col overflow-hidden">
                {/* Product image */}
                {item.image ? (
                  <div className="w-full h-44 bg-white/5 overflow-hidden rounded-t-2xl shrink-0">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={item.image}
                      alt={item.title}
                      className="w-full h-full object-cover"
                      onError={(e) => {
                        (e.currentTarget as HTMLImageElement).style.display = "none";
                      }}
                    />
                  </div>
                ) : (
                  <div className="w-full h-32 bg-white/4 rounded-t-2xl flex items-center justify-center shrink-0">
                    <span className="text-4xl opacity-30">🛍️</span>
                  </div>
                )}

                {/* Card body */}
                <div className="p-4 flex flex-col flex-1 gap-2">
                  {/* Title + priority */}
                  <div className="flex items-start gap-2">
                    <a
                      href={item.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-white font-medium text-sm leading-snug flex-1 hover:text-green-400 transition-colors line-clamp-2"
                    >
                      {item.title}
                    </a>
                    <button
                      onClick={() => togglePriority(item.id)}
                      className={`shrink-0 text-[10px] font-semibold px-2 py-0.5 rounded-full ${pm.bg} ${pm.text} transition-all`}
                      title="Click to change priority"
                    >
                      {pm.label}
                    </button>
                  </div>

                  {/* Price */}
                  <p className="text-green-400 text-xl font-bold tracking-tight">
                    £{item.price.toFixed(2)}
                  </p>

                  {/* Description */}
                  {item.description && (
                    <p className="text-white/30 text-xs line-clamp-2 leading-relaxed">
                      {item.description}
                    </p>
                  )}

                  {/* Notes */}
                  <div className="mt-1">
                    {isEditingNotes ? (
                      <div className="space-y-1.5">
                        <textarea
                          ref={notesRef}
                          value={notesValue}
                          onChange={(e) => setNotesValue(e.target.value)}
                          placeholder="Add a note…"
                          rows={2}
                          className="field w-full px-2.5 py-2 text-white text-xs resize-none"
                        />
                        <div className="flex gap-2">
                          <button
                            onClick={() => saveNotes(item.id)}
                            className="btn-primary text-xs px-3 py-1.5"
                          >
                            Save
                          </button>
                          <button
                            onClick={() => setEditingNotesId(null)}
                            className="btn-ghost text-xs px-3 py-1.5"
                          >
                            Cancel
                          </button>
                        </div>
                      </div>
                    ) : (
                      <button
                        onClick={() => startEditNotes(item)}
                        className="text-white/25 hover:text-white/50 text-xs transition-colors text-left w-full"
                      >
                        {item.notes ? (
                          <span className="text-white/50 italic">"{item.notes}"</span>
                        ) : (
                          <span>+ Add note</span>
                        )}
                      </button>
                    )}
                  </div>

                  {/* Klarna widget */}
                  {item.price > 0 && <KlarnaWidget price={item.price} />}

                  {/* Footer: date + delete */}
                  <div className="flex items-center justify-between mt-auto pt-2 border-t border-white/5">
                    <span className="text-white/20 text-[10px]">
                      {new Date(item.savedAt).toLocaleDateString("en-GB", {
                        day: "numeric",
                        month: "short",
                      })}
                    </span>
                    <button
                      onClick={() => deleteItem(item.id)}
                      className="text-white/20 hover:text-red-400 transition-colors text-xs"
                      title="Remove"
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
