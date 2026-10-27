import { NextResponse } from "next/server";
import { randomBytes } from "crypto";
import { appUrl, sessionCookieOptions } from "@/lib/auth";

const GOOGLE_STATE_COOKIE = "mijote-google-state";

export async function GET() {
  const clientId = process.env.GOOGLE_CLIENT_ID;
  if (!clientId) {
    return NextResponse.redirect(new URL("/?error=google", appUrl()));
  }

  const state = randomBytes(16).toString("base64url");
  const params = new URLSearchParams({
    client_id: clientId,
    redirect_uri: `${appUrl()}/api/auth/google/callback`,
    response_type: "code",
    scope: "openid email",
    state,
    prompt: "select_account",
  });

  const response = NextResponse.redirect(`https://accounts.google.com/o/oauth2/v2/auth?${params}`);
  response.cookies.set(GOOGLE_STATE_COOKIE, state, { ...sessionCookieOptions, maxAge: 600 });
  return response;
}
