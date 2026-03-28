import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(request: NextRequest) {
  const token = request.nextUrl.searchParams.get("token");
  if (!token) return NextResponse.json({ error: "Token requis" }, { status: 400 });

  const member = await prisma.member.findUnique({
    where: { token },
    select: { id: true, name: true },
  });

  if (!member) return NextResponse.json({ error: "Membre non trouvé" }, { status: 404 });

  return NextResponse.json(member);
}
