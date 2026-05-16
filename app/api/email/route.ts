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
      max_tokens: 1024,
      messages: [{ role: "user", content: prompt }],
    }),
  });
  const data = await res.json() as { content: { type: string; text: string }[] };
  return data.content?.[0]?.type === "text" ? data.content[0].text : "";
}

type RawEmail = {
  uid: number;
  from: string;
  fromName: string;
  subject: string;
  date: string;
  preview: string;
};

export type EmailItem = RawEmail & {
  priority: "urgent" | "reply" | "fyi" | "ignore";
  summary: string;
};

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

export async function GET() {
  const client = makeClient();

  try {
    await client.connect();
    const lock = await client.getMailboxLock("INBOX");
    const rawEmails: RawEmail[] = [];

    try {
      const total = (client.mailbox as { exists: number }).exists;
      if (total === 0) return Response.json({ emails: [] });

      const start = Math.max(1, total - 24);

      for await (const msg of client.fetch(
        `${start}:${total}`,
        {
          uid: true,
          envelope: true,
          bodyParts: ["TEXT"],
          internalDate: true,
        }
      )) {
        const from = msg.envelope?.from?.[0];
        // Get TEXT part which works for both plain text and HTML emails
        const textPart = msg.bodyParts?.get("TEXT");
        const preview = textPart?.toString("utf8")?.replace(/\s+/g, " ").trim() ?? "";

        rawEmails.push({
          uid: msg.uid,
          from: from?.address ?? "",
          fromName: from?.name || from?.address || "Unknown",
          subject: msg.envelope?.subject || "(no subject)",
          date: (msg.internalDate as Date)?.toISOString() ?? "",
          preview: preview.slice(0, 300),
        });
      }
    } finally {
      lock.release();
    }

    await client.logout();

    // Reverse so newest first
    rawEmails.reverse();

    if (rawEmails.length === 0) return Response.json({ emails: [] });

    // Batch-process with Claude
    const prompt = `You are an email assistant for Alexandra, a busy entrepreneur.
Given these emails, return a JSON array — one object per email — with these fields:
- uid: number (copy from input)
- priority: "urgent" | "reply" | "fyi" | "ignore"
  urgent = needs action today, reply = needs a response, fyi = informational, ignore = newsletters/spam
- summary: one concise sentence (max 12 words) describing what this email is about and what action is needed

Emails:
${JSON.stringify(rawEmails.map(e => ({ uid: e.uid, from: e.from, subject: e.subject, preview: e.preview })))}

Return ONLY a valid JSON array. No explanation, no markdown.`;

    const text = await callClaude(prompt);
    let aiData: { uid: number; priority: EmailItem["priority"]; summary: string }[] = [];

    try {
      const cleaned = text.replace(/```json|```/g, "").trim();
      aiData = JSON.parse(cleaned);
    } catch {
      // If Claude returns something unparseable, fall back to fyi for all
      aiData = rawEmails.map(e => ({ uid: e.uid, priority: "fyi" as const, summary: e.subject }));
    }

    const aiMap = new Map(aiData.map(a => [a.uid, a]));

    const emails: EmailItem[] = rawEmails.map(e => ({
      ...e,
      priority: aiMap.get(e.uid)?.priority ?? "fyi",
      summary: aiMap.get(e.uid)?.summary ?? e.subject,
    }));

    return Response.json({ emails });
  } catch (err) {
    console.error("Email fetch error:", err);
    return Response.json({ error: String(err) }, { status: 500 });
  }
}
