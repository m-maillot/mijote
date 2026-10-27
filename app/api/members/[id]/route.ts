import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getMemberFromRequest, normalizeEmail } from "@/lib/auth";

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const member = await getMemberFromRequest(request);
  if (!member) return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
  if (!member.isAdmin) return NextResponse.json({ error: "Accès réservé aux administrateurs" }, { status: 403 });

  const { id } = await params;
  const email = normalizeEmail((await request.json()).email);
  if (!email) return NextResponse.json({ error: "Un email valide est requis" }, { status: 400 });
  const taken = await prisma.member.findUnique({ where: { email } });
  if (taken && taken.id !== id) {
    return NextResponse.json({ error: "Cet email est déjà utilisé" }, { status: 409 });
  }

  const updated = await prisma.member.update({
    where: { id },
    data: { email },
    select: { id: true, name: true, email: true },
  });

  return NextResponse.json(updated);
}
