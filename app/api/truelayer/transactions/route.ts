import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

async function refreshToken(refreshToken: string): Promise<string | null> {
  try {
    const response = await fetch("https://auth.truelayer.com/connect/token", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        grant_type: "refresh_token",
        client_id: process.env.TRUELAYER_CLIENT_ID!,
        client_secret: process.env.TRUELAYER_CLIENT_SECRET!,
        refresh_token: refreshToken,
      }),
    });

    const tokens = await response.json();
    return tokens.access_token || null;
  } catch (err) {
    console.error("Token refresh error:", err);
    return null;
  }
}

export async function GET() {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
  try {
    const { data: tokenRows } = await supabase.from("bank_tokens").select("*");

    if (!tokenRows || tokenRows.length === 0) {
      return NextResponse.json({ error: "Not connected" }, { status: 401 });
    }

    const allTransactions = await Promise.all(
      tokenRows.map(async (row) => {
        let token = row.access_token;
        
        // Try initial request
        let accountsRes = await fetch("https://api.truelayer.com/data/v1/accounts", {
          headers: { Authorization: `Bearer ${token}` },
        });
        
        // If 401, try refreshing the token
        if (accountsRes.status === 401 && row.refresh_token) {
          const newToken = await refreshToken(row.refresh_token);
          if (newToken) {
            token = newToken;
            // Update Supabase with new token
            await supabase.from("bank_tokens").update({ access_token: newToken }).eq("id", row.id);
            // Retry with new token
            accountsRes = await fetch("https://api.truelayer.com/data/v1/accounts", {
              headers: { Authorization: `Bearer ${token}` },
            });
          }
        }


        const accountsData = await accountsRes.json();
        const accounts = accountsData.results || [];

        const txGroups = await Promise.all(
          accounts.map(async (account: { account_id: string; display_name: string; provider?: { display_name?: string } }) => {
            const txRes = await fetch(
              `https://api.truelayer.com/data/v1/accounts/${account.account_id}/transactions`,
              { headers: { Authorization: `Bearer ${token}` } }
            );
            const txData = await txRes.json();
            return (txData.results || []).map((tx: {
              description: string;
              amount: number;
              timestamp: string;
              transaction_type: string;
              transaction_category: string;
            }) => ({
              description: tx.description,
              amount: tx.amount,
              date: tx.timestamp,
              type: tx.transaction_type,
              category: tx.transaction_category,
              account: account.provider?.display_name ?? account.display_name,
            }));
          })
        );

        return txGroups.flat();
      })
    );

    const transactions = allTransactions.flat().sort(
      (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
    );

    return NextResponse.json({ transactions });
  } catch (err) {
    console.error("Transactions fetch error:", err);
    return NextResponse.json({ error: "Failed to fetch transactions" }, { status: 500 });
  }
}
