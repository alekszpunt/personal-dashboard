import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export async function GET(request: NextRequest) {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
  const code = request.nextUrl.searchParams.get("code");

  if (!code) {
    return NextResponse.json({ error: "No code provided" }, { status: 400 });
  }

  try {
    const response = await fetch("https://auth.truelayer.com/connect/token", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        grant_type: "authorization_code",
        client_id: process.env.TRUELAYER_CLIENT_ID!,
        client_secret: process.env.TRUELAYER_CLIENT_SECRET!,
        redirect_uri: `${process.env.NEXT_PUBLIC_APP_URL}/api/truelayer/callback`,
        code,
      }),
    });

    const tokens = await response.json();

    if (!tokens.access_token) {
      return NextResponse.json({ error: "Failed to get token" }, { status: 400 });
    }

    const meRes = await fetch("https://api.truelayer.com/data/v1/me", {
      headers: { Authorization: `Bearer ${tokens.access_token}` },
    });
    const meData = await meRes.json();
    const provider = meData.results?.[0]?.provider_id ?? `bank_${Date.now()}`;

    await supabase.from("bank_tokens").upsert({
      id: provider,
      access_token: tokens.access_token,
    });

    return NextResponse.redirect(`${process.env.NEXT_PUBLIC_APP_URL}/?connected=true`);
  } catch (err) {
    console.error("TrueLayer callback error:", err);
    return NextResponse.json({ error: "Auth failed" }, { status: 500 });
  }
}
