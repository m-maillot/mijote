import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import {
  COOKIE_NAME,
  appUrl,
  createSession,
  normalizeEmail,
  sessionCookieOptions,
} from "@/lib/auth";

const STATE_COOKIE = "mijote-google-state";

function fail(error: string) {
  const response = NextResponse.redirect(new URL(`/?error=${error}`, appUrl()));
  response.cookies.delete(STATE_COOKIE);
  return response;
}

export async function GET(request: NextRequest) {
  const code = request.nextUrl.searchParams.get("code");
  const state = request.nextUrl.searchParams.get("state");
  const expectedState = request.cookies.get(STATE_COOKIE)?.value;
  if (!code || !state || state !== expectedState) return fail("google");

  const tokenRes = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      code,
      client_id: process.env.GOOGLE_CLIENT_ID ?? "",
      client_secret: process.env.GOOGLE_CLIENT_SECRET ?? "",
      redirect_uri: `${appUrl()}/api/auth/google/callback`,
      grant_type: "authorization_code",
    }),
  });
  if (!tokenRes.ok) return fail("google");
  const { access_token } = await tokenRes.json();

  const infoRes = await fetch("https://openidconnect.googleapis.com/v1/userinfo", {
    headers: { Authorization: `Bearer ${access_token}` },
  });
  if (!infoRes.ok) return fail("google");
  const info = await infoRes.json();

  const email = info.email_verified ? normalizeEmail(info.email) : null;
  const member = email ? await prisma.member.findUnique({ where: { email } }) : null;
  if (!member) return fail("inconnu");

  const response = NextResponse.redirect(new URL("/recettes", appUrl()));
  response.cookies.delete(STATE_COOKIE);
  response.cookies.set(COOKIE_NAME, await createSession(member.id), sessionCookieOptions);
  return response;
}
