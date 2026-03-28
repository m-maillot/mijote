import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getMemberFromRequest } from "@/lib/auth";
import { v4 as uuid } from "uuid";

export async function GET(request: NextRequest) {
  const member = await getMemberFromRequest(request);
  if (!member) return NextResponse.json({ error: "Non autorisé" }, { status: 401 });

  // Only admins can see tokens
  if (!member.isAdmin) {
    return NextResponse.json({ error: "Accès réservé aux administrateurs" }, { status: 403 });
  }

  const members = await prisma.member.findMany({
    orderBy: { createdAt: "asc" },
    select: {
      id: true,
      name: true,
      email: true,
      token: true,
      isAdmin: true,
      createdAt: true,
      _count: { select: { recipes: true } },
    },
  });

  return NextResponse.json(members);
}

export async function POST(request: NextRequest) {
  const member = await getMemberFromRequest(request);
  if (!member) return NextResponse.json({ error: "Non autorisé" }, { status: 401 });

  if (!member.isAdmin) {
    return NextResponse.json({ error: "Seul un administrateur peut inviter des membres" }, { status: 403 });
  }

  const { name, email } = await request.json();
  if (!name?.trim()) {
    return NextResponse.json({ error: "Le nom est requis" }, { status: 400 });
  }

  const newMember = await prisma.member.create({
    data: {
      name: name.trim(),
      email: email || null,
      token: uuid(),
    },
  });

  return NextResponse.json({ id: newMember.id, token: newMember.token });
}
