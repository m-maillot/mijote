import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getMemberFromRequest } from "@/lib/auth";

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const member = await getMemberFromRequest(request);
  if (!member) return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
  if (!member.isAdmin) return NextResponse.json({ error: "Accès réservé aux administrateurs" }, { status: 403 });

  const { id } = await params;
  const { email } = await request.json();

  const updated = await prisma.member.update({
    where: { id },
    data: { email: email || null },
    select: { id: true, name: true, email: true },
  });

  return NextResponse.json(updated);
}
