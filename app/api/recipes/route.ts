import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getMemberFromRequest } from "@/lib/auth";
import { notifyNewRecipe } from "@/lib/email";

export async function GET(request: NextRequest) {
  const member = await getMemberFromRequest(request);
  if (!member) return NextResponse.json({ error: "Non autorisé" }, { status: 401 });

  const search = request.nextUrl.searchParams.get("search") ?? "";

  const recipes = await prisma.recipe.findMany({
    where: search
      ? { title: { contains: search, mode: "insensitive" } }
      : undefined,
    orderBy: { createdAt: "desc" },
    include: {
      author: { select: { name: true } },
      photos: { take: 1 },
      _count: { select: { comments: true } },
    },
  });

  return NextResponse.json(recipes);
}

export async function POST(request: NextRequest) {
  const member = await getMemberFromRequest(request);
  if (!member) return NextResponse.json({ error: "Non autorisé" }, { status: 401 });

  const { title, ingredients, steps } = await request.json();

  if (!title?.trim() || !steps?.trim() || !ingredients?.length) {
    return NextResponse.json({ error: "Tous les champs sont requis" }, { status: 400 });
  }

  const recipe = await prisma.recipe.create({
    data: {
      title: title.trim(),
      steps: steps.trim(),
      authorId: member.id,
      ingredients: {
        create: ingredients.map((ing: { quantity: string; unit: string; name: string; order: number }) => ({
          quantity: ing.quantity?.trim() || null,
          unit: ing.unit?.trim() || null,
          name: ing.name.trim(),
          order: ing.order,
        })),
      },
    },
    include: { ingredients: { orderBy: { order: "asc" } } },
  });

  // Notification email en arrière-plan (ne bloque pas la réponse)
  notifyNewRecipe(recipe.id, recipe.title, member.name).catch(console.error);

  return NextResponse.json(recipe);
}
