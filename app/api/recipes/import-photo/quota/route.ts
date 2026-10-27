import { NextRequest, NextResponse } from "next/server";
import { getMemberFromRequest } from "@/lib/auth";
import { getQuota } from "@/lib/importQuota";
import { importEnabled } from "@/lib/recipeImport";

export async function GET(request: NextRequest) {
  const member = await getMemberFromRequest(request);
  if (!member) return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
  if (!importEnabled()) {
    return NextResponse.json({ error: "Import par photo indisponible" }, { status: 503 });
  }
  return NextResponse.json(await getQuota(member.id));
}
