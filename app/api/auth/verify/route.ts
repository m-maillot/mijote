import { NextRequest, NextResponse } from "next/server";
import {
  COOKIE_NAME,
  appUrl,
  consumeLoginToken,
  createSession,
  sessionCookieOptions,
} from "@/lib/auth";

export async function GET(request: NextRequest) {
  const token = request.nextUrl.searchParams.get("token");
  const member = token ? await consumeLoginToken(token) : null;
  if (!member) {
    return NextResponse.redirect(new URL("/?error=lien", appUrl()));
  }

  const response = NextResponse.redirect(new URL("/recettes", appUrl()));
  response.cookies.set(COOKIE_NAME, await createSession(member.id), sessionCookieOptions);
  return response;
}
