import { cookies } from "next/headers";
import { prisma } from "./prisma";
import type { Member } from "@prisma/client";

const COOKIE_NAME = "family-token";

export async function getMemberFromToken(token: string | null): Promise<Member | null> {
  if (!token) return null;
  return prisma.member.findUnique({ where: { token } });
}

export async function getMemberFromCookie(): Promise<Member | null> {
  const cookieStore = await cookies();
  const token = cookieStore.get(COOKIE_NAME)?.value;
  return getMemberFromToken(token ?? null);
}

export async function getMemberFromRequest(request: Request): Promise<Member | null> {
  const url = new URL(request.url);
  const token = url.searchParams.get("token");
  if (token) return getMemberFromToken(token);

  const cookieHeader = request.headers.get("cookie") ?? "";
  const match = cookieHeader.match(new RegExp(`${COOKIE_NAME}=([^;]+)`));
  return getMemberFromToken(match?.[1] ?? null);
}

export { COOKIE_NAME };
