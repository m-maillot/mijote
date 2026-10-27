import { NextRequest, NextResponse } from "next/server";
import { getMemberFromRequest } from "@/lib/auth";
import { finishImport, getQuota, reserveImport } from "@/lib/importQuota";
import { extractRecipe, importEnabled, isImageType } from "@/lib/recipeImport";

const MAX_IMAGES = 3;

const log = (message: string, data?: Record<string, unknown>) =>
  console.log(`[import-photo] ${message}`, data ? JSON.stringify(data) : "");
const MAX_BYTES = 5 * 1024 * 1024;

export async function POST(request: NextRequest) {
  const member = await getMemberFromRequest(request);
  if (!member) return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
  if (!importEnabled()) {
    return NextResponse.json({ error: "Import par photo indisponible" }, { status: 503 });
  }

  log("requête reçue", { member: member.id });

  const formData = await request.formData();
  const files = formData.getAll("photos").filter((f): f is File => f instanceof File);
  log("fichiers", { files: files.map((f) => ({ type: f.type, size: f.size })) });
  if (files.length < 1 || files.length > MAX_IMAGES) {
    return NextResponse.json({ error: `Envoyez entre 1 et ${MAX_IMAGES} images` }, { status: 400 });
  }
  if (files.some((f) => !isImageType(f.type) || f.size > MAX_BYTES)) {
    return NextResponse.json(
      { error: "Le fichier doit être une image (JPEG, PNG ou WebP) de moins de 5 Mo." },
      { status: 400 }
    );
  }

  let importId: string | null;
  try {
    importId = await reserveImport(member.id, files.length);
  } catch (err) {
    console.error("[import-photo] réservation du créneau impossible", err);
    return NextResponse.json(
      { error: "L'import a échoué. Réessayez ou saisissez la recette à la main." },
      { status: 500 }
    );
  }
  if (!importId) {
    log("quota atteint", { member: member.id });
    const quota = await getQuota(member.id);
    return NextResponse.json(
      {
        error: `Limite de ${quota.limit} imports par jour atteinte. Réessayez demain ou saisissez la recette à la main.`,
        limit: quota.limit,
        remaining: 0,
        resetsAt: quota.resetsAt,
      },
      { status: 429 }
    );
  }

  log("créneau réservé", { importId, member: member.id });
  const startedAt = Date.now();

  try {
    const images = await Promise.all(
      files.map(async (f) => ({ type: f.type as Parameters<typeof extractRecipe>[0][number]["type"], data: Buffer.from(await f.arrayBuffer()) }))
    );
    const result = await extractRecipe(images);
    log("réponse Anthropic", {
      importId,
      ms: Date.now() - startedAt,
      isRecipe: result.isRecipe,
      ingredients: result.recipe?.ingredients.length,
      warnings: result.warnings.length,
      ...result.usage,
    });
    await finishImport(importId, result.isRecipe ? "SUCCESS" : "NO_RECIPE", result.usage);
    const { remaining } = await getQuota(member.id);

    if (!result.isRecipe) {
      return NextResponse.json(
        { error: "Aucune recette lisible sur cette photo. Essayez avec une photo plus nette.", remaining },
        { status: 422 }
      );
    }
    return NextResponse.json({ recipe: result.recipe, warnings: result.warnings, remaining });
  } catch (err) {
    console.error("[import-photo] échec", {
      importId,
      ms: Date.now() - startedAt,
      name: err instanceof Error ? err.name : typeof err,
      status: (err as { status?: number })?.status,
      message: err instanceof Error ? err.message : String(err),
    });
    await finishImport(importId, "FAILED").catch(console.error);
    return NextResponse.json(
      { error: "L'import a échoué. Réessayez ou saisissez la recette à la main." },
      { status: 502 }
    );
  }
}
