import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getMemberFromRequest } from "@/lib/auth";
import { notifyNewComment } from "@/lib/email";

export async function POST(request: NextRequest) {
  const member = await getMemberFromRequest(request);
  if (!member) return NextResponse.json({ error: "Non autorisé" }, { status: 401 });

  const { recipeId, body, field } = await request.json();

  if (!recipeId || !body?.trim()) {
    return NextResponse.json({ error: "Champs requis" }, { status: 400 });
  }

  const recipe = await prisma.recipe.findUnique({ where: { id: recipeId } });
  if (!recipe) return NextResponse.json({ error: "Recette non trouvée" }, { status: 404 });

  const validFields = ["GENERAL", "TITLE", "INGREDIENTS", "STEPS"];
  const commentField = validFields.includes(field) ? field : "GENERAL";

  const comment = await prisma.comment.create({
    data: {
      recipeId,
      authorId: member.id,
      body: body.trim(),
      field: commentField,
    },
    include: {
      author: { select: { id: true, name: true } },
      votes: true,
    },
  });

  // Notification email en arrière-plan
  notifyNewComment(recipeId, recipe.title, member.name, commentField).catch((err) =>
    console.error("[Email] Erreur notification commentaire:", err)
  );

  return NextResponse.json(comment);
}
