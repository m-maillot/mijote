import { cookies } from "next/headers";
import { createHash, randomBytes } from "crypto";
import { prisma } from "./prisma";
import type { Member } from "@prisma/client";

const COOKIE_NAME = "mijote-session";
const SESSION_TTL_MS = 1000 * 60 * 60 * 24 * 90;
const LOGIN_TOKEN_TTL_MS = 1000 * 60 * 15;

function hash(token: string) {
  return createHash("sha256").update(token).digest("hex");
}

function newToken() {
  return randomBytes(32).toString("base64url");
}

export function appUrl() {
  return process.env.APP_URL || "http://localhost:3010";
}

export function normalizeEmail(email: unknown): string | null {
  if (typeof email !== "string") return null;
  const value = email.trim().toLowerCase();
  return value.includes("@") ? value : null;
}

export const sessionCookieOptions = {
  httpOnly: true,
  sameSite: "lax" as const,
  secure: appUrl().startsWith("https"),
  path: "/",
  maxAge: SESSION_TTL_MS / 1000,
};

export async function createSession(memberId: string): Promise<string> {
  const token = newToken();
  await prisma.session.create({
    data: {
      tokenHash: hash(token),
      memberId,
      expiresAt: new Date(Date.now() + SESSION_TTL_MS),
    },
  });
  return token;
}

export async function deleteSession(token: string) {
  await prisma.session.deleteMany({ where: { tokenHash: hash(token) } });
}

export async function getMemberFromSession(token: string | null | undefined): Promise<Member | null> {
  if (!token) return null;
  const session = await prisma.session.findUnique({
    where: { tokenHash: hash(token) },
    include: { member: true },
  });
  if (!session || session.expiresAt < new Date()) return null;
  return session.member;
}

export async function getMemberFromCookie(): Promise<Member | null> {
  const cookieStore = await cookies();
  return getMemberFromSession(cookieStore.get(COOKIE_NAME)?.value);
}

export async function getMemberFromRequest(request: Request): Promise<Member | null> {
  const cookieHeader = request.headers.get("cookie") ?? "";
  const match = cookieHeader.match(new RegExp(`(?:^|;\\s*)${COOKIE_NAME}=([^;]+)`));
  return getMemberFromSession(match?.[1]);
}

/** Crée un lien magique pour ce membre, ou null si un lien a déjà été envoyé il y a moins d'une minute. */
export async function createLoginToken(memberId: string): Promise<string | null> {
  const recent = await prisma.loginToken.findFirst({
    where: { memberId, createdAt: { gt: new Date(Date.now() - 60_000) } },
  });
  if (recent) return null;

  await prisma.loginToken.deleteMany({ where: { expiresAt: { lt: new Date() } } });

  const token = newToken();
  await prisma.loginToken.create({
    data: {
      tokenHash: hash(token),
      memberId,
      expiresAt: new Date(Date.now() + LOGIN_TOKEN_TTL_MS),
    },
  });
  return token;
}

/** Usage unique : le lien est supprimé dès qu'il est consommé. */
export async function consumeLoginToken(token: string): Promise<Member | null> {
  const tokenHash = hash(token);
  const found = await prisma.loginToken.findUnique({
    where: { tokenHash },
    include: { member: true },
  });
  if (!found) return null;

  const { count } = await prisma.loginToken.deleteMany({ where: { tokenHash } });
  if (count !== 1 || found.expiresAt < new Date()) return null;
  return found.member;
}

export { COOKIE_NAME };
