import { NextRequest, NextResponse } from "next/server";
import { kv } from "@vercel/kv";

export interface MoodboardItem {
  id: string;
  imageUrl: string;
  title: string;
  project: string;
  note: string;
  sourceUrl: string;
  addedAt: string;
  source: "pinterest" | "manual";
}

export async function POST(req: NextRequest) {
  // Auth check
  const auth = req.headers.get("authorization");
  const secret = process.env.MOODBOARD_SECRET;
  if (!secret || auth !== `Bearer ${secret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let body: Partial<MoodboardItem>;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const { imageUrl, title, project, note, sourceUrl } = body;
  if (!imageUrl) {
    return NextResponse.json({ error: "imageUrl is required" }, { status: 400 });
  }

  const item: MoodboardItem = {
    id: Date.now().toString(),
    imageUrl,
    title: title || "Pinterest pin",
    project: project || "General",
    note: note || "",
    sourceUrl: sourceUrl || "",
    addedAt: new Date().toISOString(),
    source: "pinterest",
  };

  // Push to front of list in KV
  await kv.lpush("moodboard:items", JSON.stringify(item));
  // Keep max 500 items
  await kv.ltrim("moodboard:items", 0, 499);

  return NextResponse.json({ ok: true, item });
}
