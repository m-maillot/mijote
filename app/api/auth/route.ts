import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { COOKIE_NAME } from "@/lib/auth";

export async function GET(request: NextRequest) {
  const token = request.nextUrl.searchParams.get("token");
  if (!token) {
    return NextResponse.redirect(new URL("/", process.env.APP_URL || request.url));
  }

  const member = await prisma.member.findUnique({ where: { token } });
  if (!member) {
    return NextResponse.redirect(new URL("/", process.env.APP_URL || request.url));
  }

  const redirectPath = request.nextUrl.searchParams.get("redirect") || "/recettes";
  const baseUrl = process.env.APP_URL || request.url;
  const response = NextResponse.redirect(new URL(redirectPath, baseUrl));
  response.cookies.set(COOKIE_NAME, token, {
    httpOnly: true,
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24 * 365,
  });

  return response;
}
