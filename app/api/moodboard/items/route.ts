import { NextResponse } from "next/server";
import { kv } from "@vercel/kv";

export async function GET() {
  try {
    const raw = await kv.lrange("moodboard:items", 0, 499);
    const items = raw.map((r) => (typeof r === "string" ? JSON.parse(r) : r));
    return NextResponse.json({ items });
  } catch {
    return NextResponse.json({ items: [] });
  }
}
