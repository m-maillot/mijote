import { NextRequest, NextResponse } from "next/server";
import { COOKIE_NAME, appUrl, deleteSession } from "@/lib/auth";

export async function POST(request: NextRequest) {
  const token = request.cookies.get(COOKIE_NAME)?.value;
  if (token) await deleteSession(token);

  const response = NextResponse.redirect(new URL("/", appUrl()), 303);
  response.cookies.delete(COOKIE_NAME);
  return response;
}
