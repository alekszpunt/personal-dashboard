import { NextResponse } from "next/server";

export async function GET() {
  const clientId = process.env.TRUELAYER_CLIENT_ID;
  const redirectUri = `${process.env.NEXT_PUBLIC_APP_URL}/api/truelayer/callback`;

  const params = new URLSearchParams({
    response_type: "code",
    client_id: clientId!,
    redirect_uri: redirectUri,
    scope: "info accounts balance transactions",
    providers: "uk-ob-all uk-oauth-all",
  });

  const authUrl = `https://auth.truelayer.com/?${params.toString()}`;
  return NextResponse.redirect(authUrl);
}
