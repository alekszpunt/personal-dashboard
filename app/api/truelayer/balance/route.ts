import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export async function GET() {
  try {
    const { data: tokenRows } = await supabase.from("bank_tokens").select("*");

    if (!tokenRows || tokenRows.length === 0) {
      return NextResponse.json({ error: "Not connected" }, { status: 401 });
    }

    const allBalances = await Promise.all(
      tokenRows.map(async (row) => {
        const token = row.access_token;

        const accountsRes = await fetch("https://api.truelayer.com/data/v1/accounts", {
          headers: { Authorization: `Bearer ${token}` },
        });
        const accountsData = await accountsRes.json();
        const accounts = accountsData.results || [];

        const balances = await Promise.all(
          accounts.map(async (account: { account_id: string; display_name: string; account_type: string; provider?: { display_name?: string } }) => {
            const balRes = await fetch(
              `https://api.truelayer.com/data/v1/accounts/${account.account_id}/balance`,
              { headers: { Authorization: `Bearer ${token}` } }
            );
            const balData = await balRes.json();
            return {
              name: account.provider?.display_name ?? row.id,
              accountName: account.display_name,
              type: account.account_type,
              current: balData.results?.[0]?.current ?? 0,
              available: balData.results?.[0]?.available ?? balData.results?.[0]?.current ?? 0,
              currency: balData.results?.[0]?.currency ?? "GBP",
            };
          })
        );

        return balances;
      })
    );

    return NextResponse.json({ balances: allBalances.flat() });
  } catch (err) {
    console.error("Balance fetch error:", err);
    return NextResponse.json({ error: "Failed to fetch balances" }, { status: 500 });
  }
}
