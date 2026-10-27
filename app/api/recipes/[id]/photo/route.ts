import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getMemberFromRequest } from "@/lib/auth";
import { randomUUID } from "crypto";
import { putPhoto } from "@/lib/storage";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const member = await getMemberFromRequest(request);
  if (!member) return NextResponse.json({ error: "Non autorisé" }, { status: 401 });

  const { id } = await params;
  const recipe = await prisma.recipe.findUnique({ where: { id } });
  if (!recipe) return NextResponse.json({ error: "Recette non trouvée" }, { status: 404 });

  const formData = await request.formData();
  const file = formData.get("photo") as File | null;
  if (!file) return NextResponse.json({ error: "Aucun fichier" }, { status: 400 });

  if (!file.type.startsWith("image/")) {
    return NextResponse.json({ error: "Le fichier doit être une image" }, { status: 400 });
  }

  const ext = (file.name.split(".").pop() || "jpg").toLowerCase().replace(/[^a-z0-9]/g, "") || "jpg";
  const filename = `${randomUUID()}.${ext}`;

  try {
    await putPhoto(`photos/${filename}`, Buffer.from(await file.arrayBuffer()), file.type);
  } catch (err) {
    console.error("[storage] envoi photo:", err);
    return NextResponse.json({ error: "Erreur de stockage" }, { status: 500 });
  }

  const photo = await prisma.recipePhoto.create({
    data: { recipeId: id, filename },
  });

  return NextResponse.json(photo);
}
