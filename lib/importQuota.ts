import { prisma } from "./prisma";

const TIMEZONE = "Europe/Paris";
const PENDING_TTL_MS = 2 * 60_000;

export function importDailyLimit() {
  const n = Math.floor(Number(process.env.IMPORT_DAILY_LIMIT));
  return Number.isFinite(n) && n >= 1 ? n : 20;
}

function parisParts(date: Date) {
  const parts = Object.fromEntries(
    new Intl.DateTimeFormat("en-CA", {
      timeZone: TIMEZONE,
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
      hourCycle: "h23",
    })
      .formatToParts(date)
      .map((p) => [p.type, Number(p.value)])
  );
  return parts as Record<"year" | "month" | "day" | "hour" | "minute" | "second", number>;
}

/** Jour calendaire courant en Europe/Paris, au format YYYY-MM-DD. */
export function currentDay(now = new Date()) {
  const p = parisParts(now);
  return `${p.year}-${String(p.month).padStart(2, "0")}-${String(p.day).padStart(2, "0")}`;
}

/** Prochain minuit à Paris. */
export function nextReset(now = new Date()) {
  const p = parisParts(now);
  const localAsUtc = Date.UTC(p.year, p.month - 1, p.day, p.hour, p.minute, p.second);
  const offset = localAsUtc - Math.floor(now.getTime() / 1000) * 1000;
  return new Date(Date.UTC(p.year, p.month - 1, p.day + 1) - offset);
}

function countedWhere(memberId: string, day: string) {
  return {
    memberId,
    day,
    OR: [
      { status: { in: ["SUCCESS", "NO_RECIPE"] as ("SUCCESS" | "NO_RECIPE")[] } },
      { status: "PENDING" as const, createdAt: { gt: new Date(Date.now() - PENDING_TTL_MS) } },
    ],
  };
}

export async function getQuota(memberId: string) {
  const limit = importDailyLimit();
  const day = currentDay();
  const used = await prisma.recipeImport.count({ where: countedWhere(memberId, day) });
  return { limit, used, remaining: Math.max(0, limit - used), resetsAt: nextReset().toISOString() };
}

/**
 * Réserve un créneau avant l'appel à Anthropic. Le verrou consultatif sérialise les
 * requêtes d'un même membre : des appels parallèles ne peuvent pas dépasser la limite.
 * Renvoie l'id de l'import, ou null si le quota est atteint.
 */
export async function reserveImport(memberId: string, imageCount: number): Promise<string | null> {
  const limit = importDailyLimit();
  const day = currentDay();

  return prisma.$transaction(async (tx) => {
    await tx.$queryRaw`SELECT pg_advisory_xact_lock(hashtext(${memberId}))`;
    const used = await tx.recipeImport.count({ where: countedWhere(memberId, day) });
    if (used >= limit) return null;
    const created = await tx.recipeImport.create({ data: { memberId, day, imageCount } });
    return created.id;
  });
}

export async function finishImport(
  id: string,
  status: "SUCCESS" | "NO_RECIPE" | "FAILED",
  usage?: { inputTokens: number; outputTokens: number }
) {
  await prisma.recipeImport.update({
    where: { id },
    data: { status, inputTokens: usage?.inputTokens, outputTokens: usage?.outputTokens },
  });
}
