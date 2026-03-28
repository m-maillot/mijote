import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getMemberFromRequest } from "@/lib/auth";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const member = await getMemberFromRequest(request);
  if (!member) return NextResponse.json({ error: "Non autorisé" }, { status: 401 });

  const { id } = await params;
  const recipe = await prisma.recipe.findUnique({
    where: { id },
    include: {
      author: { select: { id: true, name: true } },
      ingredients: { orderBy: { order: "asc" } },
      photos: true,
      comments: {
        orderBy: { createdAt: "desc" },
        include: {
          author: { select: { id: true, name: true } },
          votes: true,
        },
      },
    },
  });

  if (!recipe) return NextResponse.json({ error: "Recette non trouvée" }, { status: 404 });

  return NextResponse.json(recipe);
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const member = await getMemberFromRequest(request);
  if (!member) return NextResponse.json({ error: "Non autorisé" }, { status: 401 });

  const { id } = await params;
  const recipe = await prisma.recipe.findUnique({ where: { id } });

  if (!recipe) return NextResponse.json({ error: "Recette non trouvée" }, { status: 404 });
  if (recipe.authorId !== member.id) {
    return NextResponse.json({ error: "Seul l'auteur peut modifier" }, { status: 403 });
  }

  const { title, ingredients, steps } = await request.json();

  const updated = await prisma.$transaction(async (tx) => {
    if (ingredients) {
      await tx.ingredient.deleteMany({ where: { recipeId: id } });
      await tx.ingredient.createMany({
        data: ingredients.map((ing: { quantity: string; unit: string; name: string; order: number }) => ({
          recipeId: id,
          quantity: ing.quantity?.trim() || null,
          unit: ing.unit?.trim() || null,
          name: ing.name.trim(),
          order: ing.order,
        })),
      });
    }

    return tx.recipe.update({
      where: { id },
      data: {
        ...(title && { title: title.trim() }),
        ...(steps && { steps: steps.trim() }),
      },
      include: { ingredients: { orderBy: { order: "asc" } } },
    });
  });

  return NextResponse.json(updated);
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const member = await getMemberFromRequest(request);
  if (!member) return NextResponse.json({ error: "Non autorisé" }, { status: 401 });

  const { id } = await params;
  const recipe = await prisma.recipe.findUnique({ where: { id } });

  if (!recipe) return NextResponse.json({ error: "Recette non trouvée" }, { status: 404 });
  if (recipe.authorId !== member.id) {
    return NextResponse.json({ error: "Seul l'auteur peut supprimer" }, { status: 403 });
  }

  await prisma.recipe.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}
