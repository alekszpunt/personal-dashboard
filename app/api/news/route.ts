import { NextResponse } from "next/server";

export interface NewsItem {
  id: string;
  title: string;
  summary: string;
  source: string;
  url: string;
  publishedAt: string;
  category: string;
}

const FEEDS: { url: string; source: string; category: string }[] = [
  { url: "https://feeds.bbci.co.uk/news/rss.xml",            source: "BBC News",      category: "Top Stories" },
  { url: "https://feeds.bbci.co.uk/news/technology/rss.xml", source: "BBC Tech",      category: "Technology" },
  { url: "https://feeds.bbci.co.uk/news/business/rss.xml",   source: "BBC Business",  category: "Business" },
  { url: "https://www.theguardian.com/uk/rss",               source: "The Guardian",  category: "UK" },
];

function stripTags(html: string) {
  return html.replace(/<[^>]*>/g, "").replace(/&amp;/g, "&").replace(/&lt;/g, "<").replace(/&gt;/g, ">").replace(/&quot;/g, '"').replace(/&#39;/g, "'").trim();
}

function parseRSS(xml: string, source: string, category: string): NewsItem[] {
  const items: NewsItem[] = [];
  const itemRegex = /<item>([\s\S]*?)<\/item>/g;
  let match;
  while ((match = itemRegex.exec(xml)) !== null) {
    const block = match[1];
    const title = stripTags((block.match(/<title>([\s\S]*?)<\/title>/) || [])[1] || "");
    const link  = stripTags((block.match(/<link>([\s\S]*?)<\/link>/)   || [])[1] || "");
    const desc  = stripTags((block.match(/<description>([\s\S]*?)<\/description>/) || [])[1] || "");
    const pubDate = stripTags((block.match(/<pubDate>([\s\S]*?)<\/pubDate>/) || [])[1] || "");
    const guid = stripTags((block.match(/<guid[^>]*>([\s\S]*?)<\/guid>/) || [])[1] || link || title);

    if (!title || !link) continue;

    items.push({
      id: guid,
      title,
      summary: desc.slice(0, 160) + (desc.length > 160 ? "…" : ""),
      source,
      url: link,
      publishedAt: pubDate ? new Date(pubDate).toISOString() : new Date().toISOString(),
      category,
    });
  }
  return items;
}

export async function GET() {
  try {
    const results = await Promise.allSettled(
      FEEDS.map(async ({ url, source, category }) => {
        const res = await fetch(url, { next: { revalidate: 900 } });
        const xml = await res.text();
        return parseRSS(xml, source, category).slice(0, 6);
      })
    );

    const articles: NewsItem[] = [];
    for (const r of results) {
      if (r.status === "fulfilled") articles.push(...r.value);
    }

    // Sort by date, newest first
    articles.sort((a, b) => new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime());

    return NextResponse.json({ articles: articles.slice(0, 30) });
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}
