import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { appUrl, createLoginToken, normalizeEmail } from "@/lib/auth";
import { sendLoginLink } from "@/lib/email";

// Réponse identique que l'email soit connu ou non : on ne révèle pas qui est membre.
export async function POST(request: NextRequest) {
  const body = await request.json().catch(() => ({}));
  const email = normalizeEmail(body.email);
  if (!email) {
    return NextResponse.json({ error: "Email invalide" }, { status: 400 });
  }

  const member = await prisma.member.findUnique({ where: { email } });
  if (member) {
    const token = await createLoginToken(member.id);
    if (token) {
      const link = `${appUrl()}/api/auth/verify?token=${encodeURIComponent(token)}`;
      await sendLoginLink(email, member.name, link);
    }
  }

  return NextResponse.json({ ok: true });
}
