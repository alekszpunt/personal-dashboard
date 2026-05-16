import { ImapFlow } from "imapflow";

// Vercel: allow up to 60s for this route (requires Pro plan)
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
      max_tokens: 512,
      messages: [{ role: "user", content: prompt }],
    }),
  });
  const data = await res.json() as { content: { type: string; text: string }[] };
  return data.content?.[0]?.type === "text" ? data.content[0].text : "";
}

function makeClient() {
  return new ImapFlow({
    host: "imap.mail.me.com",
    port: 993,
    secure: true,
    auth: {
      user: process.env.ICLOUD_EMAIL!,
      pass: process.env.ICLOUD_APP_PASSWORD!,
    },
    logger: false,
  });
}

export async function POST(request: Request) {
  const { uid } = await request.json() as { uid: number };
  if (!uid) return Response.json({ error: "uid required" }, { status: 400 });

  const client = makeClient();

  try {
    await client.connect();
    const lock = await client.getMailboxLock("INBOX");
    let emailBody = "";
    let subject = "";
    let fromAddr = "";

    try {
      const msg = await client.fetchOne(
        String(uid),
        { uid: true, envelope: true, source: true },
        { uid: true }
      );

      if (!msg) return Response.json({ error: "Email not found" }, { status: 404 });

      subject = msg.envelope?.subject ?? "";
      fromAddr = msg.envelope?.from?.[0]?.address ?? "";

      // Extract readable text from raw source — strip MIME headers and HTML tags
      const raw = msg.source?.toString("utf8") ?? "";
      emailBody = raw
        .replace(/<[^>]+>/g, " ")        // strip HTML tags
        .replace(/^[\w-]+:.*$/gm, "")    // strip MIME headers
        .replace(/--[^\n]+/g, "")        // strip MIME boundaries
        .replace(/\s{3,}/g, "\n\n")      // collapse whitespace
        .trim()
        .slice(0, 3000);
    } finally {
      lock.release();
    }

    await client.logout();

    const prompt = `You are helping Alexandra, a British entrepreneur, draft a professional email reply.

Original email:
From: ${fromAddr}
Subject: ${subject}
Body:
${emailBody}

Write a concise, professional reply in Alexandra's voice. She is direct, warm, and efficient.
Keep it short — no waffle. Use British spelling. Do NOT include a subject line or "Dear..." opening unless it's clearly needed.
Return only the reply body text, nothing else.`;

    const draft = await callClaude(prompt);

    return Response.json({ draft });
  } catch (err) {
    console.error("Reply draft error:", err);
    return Response.json({ error: String(err) }, { status: 500 });
  }
}
