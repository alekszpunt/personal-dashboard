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

    const balances = await Promise.all(
      accounts.map(async (account: { account_id: string; display_name: string; account_type: string; provider?: { display_name?: string } }) => {
        const balRes = await fetch(
          `https://api.truelayer.com/data/v1/accounts/${account.account_id}/balance`,
          { headers: { Authorization: `Bearer ${token}` } }
        );
        const balData = await balRes.json();
        return {
          name: account.provider?.display_name ?? account.display_name,
          accountName: account.display_name,
          type: account.account_type,
          current: balData.results?.[0]?.current ?? 0,
          available: balData.results?.[0]?.available ?? balData.results?.[0]?.current ?? 0,
          currency: balData.results?.[0]?.currency ?? "GBP",
        };
      })
    );

    return NextResponse.json({ balances });
  } catch (err) {
    console.error("Balance fetch error:", err);
    return NextResponse.json({ error: "Failed to fetch balances" }, { status: 500 });
  }
}
