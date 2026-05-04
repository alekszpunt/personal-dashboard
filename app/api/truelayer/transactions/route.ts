import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  const token = request.cookies.get("tl_access_token")?.value;

  if (!token) {
    return NextResponse.json({ error: "Not connected" }, { status: 401 });
  }

  try {
    const accountsRes = await fetch("https://api.truelayer.com/data/v1/accounts", {
      headers: { Authorization: `Bearer ${token}` },
    });

    const accountsData = await accountsRes.json();
    const accounts = accountsData.results || [];

    const allTransactions = await Promise.all(
      accounts.map(async (account: { account_id: string; display_name: string }) => {
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
          account: account.display_name,
        }));
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
