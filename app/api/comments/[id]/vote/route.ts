import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getMemberFromRequest } from "@/lib/auth";
import { checkAndApplyApproval } from "@/lib/approval";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const member = await getMemberFromRequest(request);
  if (!member) return NextResponse.json({ error: "Non autorisé" }, { status: 401 });

  const { id: commentId } = await params;
  const { approve } = await request.json();

  if (typeof approve !== "boolean") {
    return NextResponse.json({ error: "approve doit être un booléen" }, { status: 400 });
  }

  const comment = await prisma.comment.findUnique({ where: { id: commentId } });
  if (!comment) return NextResponse.json({ error: "Commentaire non trouvé" }, { status: 404 });

  if (comment.authorId === member.id) {
    return NextResponse.json({ error: "Vous ne pouvez pas voter pour votre propre commentaire" }, { status: 403 });
  }

  if (comment.status !== "PENDING") {
    return NextResponse.json({ error: "Ce commentaire n'est plus en attente" }, { status: 400 });
  }

  await prisma.commentVote.upsert({
    where: {
      commentId_memberId: {
        commentId,
        memberId: member.id,
      },
    },
    update: { approve },
    create: {
      commentId,
      memberId: member.id,
      approve,
    },
  });

  await checkAndApplyApproval(commentId);

  const updated = await prisma.comment.findUnique({
    where: { id: commentId },
    include: {
      author: { select: { id: true, name: true } },
      votes: { select: { memberId: true, approve: true } },
    },
  });

  return NextResponse.json(updated);
}
