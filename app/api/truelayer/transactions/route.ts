import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

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
        const token = row.access_token;

        const accountsRes = await fetch("https://api.truelayer.com/data/v1/accounts", {
          headers: { Authorization: `Bearer ${token}` },
        });
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
