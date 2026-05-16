import { NextResponse } from "next/server";

export const maxDuration = 60;

async function callClaude(prompt: string): Promise<string> {
  const res = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "x-api-key": process.env.ANTHROPIC_API_KEY!,
      "anthropic-version": "2023-06-01",
      "content-type": "application/json",
    },
    body: JSON.stringify({
      model: "claude-haiku-4-5-20251001",
      max_tokens: 2048,
      messages: [{ role: "user", content: prompt }],
    }),
  });
  const data = await res.json() as { content: { type: string; text: string }[] };
  return data.content?.[0]?.type === "text" ? data.content[0].text : "";
}

async function extractVideoContent(url: string): Promise<string> {
  // For now, fetch the page and extract what we can
  // Later: could use yt-dlp or Instagram API for better extraction
  try {
    const response = await fetch(url, {
      headers: {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36"
      }
    });
    const html = await response.text();
    
    // Basic extraction - look for meta description or content
    const metaDesc = html.match(/<meta[^>]*property="og:description"[^>]*content="([^"]*)"[^>]*>/i)?.[1] || "";
    const metaTitle = html.match(/<meta[^>]*property="og:title"[^>]*content="([^"]*)"[^>]*>/i)?.[1] || "";
    
    return `Title: ${metaTitle}\nDescription: ${metaDesc}`;
  } catch (err) {
    console.error("Video extraction error:", err);
    return "Could not extract video content. Please provide a summary.";
  }
}

export async function POST(request: Request) {
  try {
    const { url } = await request.json() as { url: string };
    
    if (!url) {
      return NextResponse.json({ error: "URL required" }, { status: 400 });
    }

    // Extract content from video
    const content = await extractVideoContent(url);

    // Use Claude to analyze and categorize
    const prompt = `You are helping Alexandra organize and learn from educational content.

Video URL: ${url}
Extracted content:
${content}

Analyze this content and return a JSON object with these fields:
- title: A clear, descriptive title (max 80 chars)
- category: One of: "Finance", "Design", "Business", "AI & Tech", "Personal Development", "Health & Wellness", "Other"
- summary: A 2-3 sentence summary of the main message
- keyTakeaways: Array of 3-5 bullet points (each max 100 chars) - the main lessons
- actionItems: Array of 2-3 specific things Alexandra can DO to apply this (each max 100 chars)

Be practical and actionable. Focus on what she can implement immediately.

Return ONLY valid JSON. No explanation, no markdown.`;

    const aiResponse = await callClaude(prompt);
    
    let parsed: {
      title: string;
      category: string;
      summary: string;
      keyTakeaways: string[];
      actionItems: string[];
    };

    try {
      const cleaned = aiResponse.replace(/```json|```/g, "").trim();
      parsed = JSON.parse(cleaned);
    } catch {
      // Fallback if parsing fails
      return NextResponse.json({
        title: "Video content",
        category: "Other",
        summary: "Could not process this video automatically.",
        keyTakeaways: ["Manual review needed"],
        actionItems: ["Review the video content"],
        url,
        addedAt: new Date().toISOString(),
        status: "saved"
      });
    }

    return NextResponse.json({
      ...parsed,
      url,
      addedAt: new Date().toISOString(),
      status: "saved"
    });

  } catch (err) {
    console.error("Process video error:", err);
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}
