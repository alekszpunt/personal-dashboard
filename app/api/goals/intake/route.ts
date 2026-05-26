import { NextResponse } from "next/server";

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
      max_tokens: 1024,
      messages: [{ role: "user", content: prompt }],
    }),
  });
  const data = await res.json() as { content: { type: string; text: string }[] };
  return data.content?.[0]?.type === "text" ? data.content[0].text : "";
}

export async function POST(req: Request) {
  try {
    const { input } = await req.json() as { input: string };
    if (!input?.trim()) {
      return NextResponse.json({ error: "Input is required" }, { status: 400 });
    }

    const prompt = `You are a personal goal coach. The user has described something they want to achieve or do.
Analyse it and return a JSON object (and ONLY valid JSON, no markdown, no extra text).

User input: "${input}"

Return this exact structure:
{
  "category": "learning" | "finance" | "health" | "goals" | "tasks",
  "title": "short title (max 8 words)",
  "summary": "one sentence description of what they want to achieve",
  "simple": true | false,
  "plan": [
    { "step": "concrete action step description", "timeframe": "e.g. Week 1, Month 1, Day 1", "done": false }
  ],
  "financeGoal": {
    "monthlyAmount": 200,
    "targetTotal": null,
    "timeframeMonths": null,
    "purpose": "description of what the money is for"
  } | null,
  "tags": ["tag1", "tag2"]
}

Category rules — BE STRICT, pick the most specific match:
- "finance": saving money, budgeting, debt, investments, financial targets, spending less, earning more
- "learning": acquiring a skill, completing a course, reading, education, practising something, studying
- "health": fitness, exercise, diet, nutrition, mental health, medical, wellbeing, sleep, drinking less
- "tasks": a one-off errand or short action — ordering something, booking something, sending something, calling someone, buying something, any quick to-do
- "goals": longer-term life aspirations, personal growth, relationships, travel, career changes — only use this if NONE of the above fit
- NEVER default to "goals" when another category clearly fits

Simple task rules:
- Set "simple": true if the input is a quick one-off task or errand (e.g. "order vape pen", "book dentist", "call mum", "buy milk")
- Set "simple": false for anything that genuinely needs planning over time
- If simple is true, plan should have exactly 1 step with timeframe "Today"
- If simple is false, plan should have 4-6 realistic steps

Other rules:
- financeGoal should ONLY be populated if category is "finance". Otherwise set it to null.
- For financeGoal, estimate reasonable monthly amounts from the user's description. Use null for fields you cannot determine.
- tags should be 2-4 short lowercase keywords
- Return ONLY the JSON object, nothing else`;

    const raw = await callClaude(prompt);

    // Strip any accidental markdown code fences
    const cleaned = raw.replace(/^```(?:json)?\s*/i, "").replace(/\s*```$/i, "").trim();
    const result = JSON.parse(cleaned);

    return NextResponse.json(result);
  } catch (err) {
    console.error("Goals intake error:", err);
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}
