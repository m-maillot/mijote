import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getMemberFromRequest } from "@/lib/auth";

// Un pouce vers le haut par membre : POST l'ajoute, DELETE le retire.
// Il ne modifie jamais la recette, la suggestion reste une suggestion.
async function resolveComment(request: NextRequest, params: Promise<{ id: string }>) {
  const member = await getMemberFromRequest(request);
  if (!member) return { error: NextResponse.json({ error: "Non autorisé" }, { status: 401 }) };

  const { id: commentId } = await params;
  const comment = await prisma.comment.findUnique({ where: { id: commentId } });
  if (!comment) return { error: NextResponse.json({ error: "Commentaire non trouvé" }, { status: 404 }) };

  if (comment.authorId === member.id) {
    return {
      error: NextResponse.json(
        { error: "Vous ne pouvez pas voter pour votre propre suggestion" },
        { status: 403 }
      ),
    };
  }

  return { member, commentId };
}

async function respond(commentId: string) {
  const updated = await prisma.comment.findUnique({
    where: { id: commentId },
    include: {
      author: { select: { id: true, name: true } },
      votes: { select: { memberId: true, approve: true } },
    },
  });
  return NextResponse.json(updated);
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const ctx = await resolveComment(request, params);
  if ("error" in ctx) return ctx.error;

  await prisma.commentVote.upsert({
    where: { commentId_memberId: { commentId: ctx.commentId, memberId: ctx.member.id } },
    update: { approve: true },
    create: { commentId: ctx.commentId, memberId: ctx.member.id, approve: true },
  });

  return respond(ctx.commentId);
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const ctx = await resolveComment(request, params);
  if ("error" in ctx) return ctx.error;

  await prisma.commentVote.deleteMany({
    where: { commentId: ctx.commentId, memberId: ctx.member.id },
  });

  return respond(ctx.commentId);
}
