"use client";

import { useRouter } from "next/navigation";
import DiffView from "./DiffView";
import { memberInk } from "@/lib/memberInk";
import type { CommentData, RecipeSnapshot } from "./types";

const fieldLabels: Record<string, string> = {
  TITLE: "Titre",
  INGREDIENTS: "Ingrédients",
  STEPS: "Préparation",
};

const statusLabels: Record<string, { label: string; className: string }> = {
  PENDING: { label: "En attente", className: "bg-warning/20 text-warning" },
  APPROVED: { label: "Appliquée", className: "bg-success/20 text-success" },
  REJECTED: { label: "Rejetée", className: "bg-danger/20 text-danger" },
};

export default function SuggestionList({
  suggestions,
  currentMemberId,
  recipe,
  threshold,
}: {
  suggestions: CommentData[];
  currentMemberId: string;
  recipe: RecipeSnapshot;
  threshold: number;
}) {
  const router = useRouter();

  if (suggestions.length === 0) return null;

  const byAuthor = new Map<string, { name: string; items: CommentData[] }>();
  for (const s of suggestions) {
    const group = byAuthor.get(s.author.id) ?? { name: s.author.name, items: [] };
    group.items.push(s);
    byAuthor.set(s.author.id, group);
  }

  async function handleVote(commentId: string, approve: boolean) {
    try {
      const res = await fetch(`/api/comments/${commentId}/vote`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ approve }),
      });
      if (!res.ok) throw new Error();
      router.refresh();
    } catch {
      alert("Erreur lors du vote");
    }
  }

  return (
    <section aria-labelledby="suggestions-title" className="mt-8 space-y-4">
      <h2 id="suggestions-title" className="font-heading text-2xl font-semibold md:text-[26px]">
        Suggestions
      </h2>

      {[...byAuthor.entries()].map(([authorId, { name, items }]) => (
        <div key={authorId} className="rounded-[10px] border-[1.5px] border-success bg-surface px-4 py-5 md:px-6">
          <div className="font-semibold" style={{ color: memberInk(name) }}>
            Suggestion de {name}
          </div>

          <div className="mt-3 divide-y divide-line">
            {items.map((s) => {
              const approves = s.votes.filter((v) => v.approve).length;
              const myVote = s.votes.find((v) => v.memberId === currentMemberId);
              const isAuthor = s.author.id === currentMemberId;
              const status = statusLabels[s.status];
              const percent = Math.min(100, Math.round((approves / threshold) * 100));

              return (
                <div key={s.id} className="py-4 first:pt-0 last:pb-0">
                  <div className="mb-2 flex flex-wrap items-center gap-2 text-sm">
                    <span className="rounded-full bg-subtle px-2.5 py-0.5 text-muted">
                      {fieldLabels[s.field]}
                    </span>
                    <span className={`rounded-full px-2.5 py-0.5 ${status.className}`}>
                      {status.label}
                    </span>
                    <span className="text-muted">
                      {new Date(s.createdAt).toLocaleDateString("fr-FR", { day: "numeric", month: "long" })}
                    </span>
                  </div>

                  <DiffView comment={s} recipe={recipe} />

                  {s.status === "PENDING" && (
                    <div className="mt-4 flex flex-wrap items-center gap-4">
                      <div className="flex min-w-[140px] flex-1 items-center gap-2.5">
                        <div className="h-2 flex-1 rounded bg-line">
                          <div className="h-2 rounded bg-success-solid" style={{ width: `${percent}%` }} />
                        </div>
                        <span className="text-sm text-muted">
                          {approves} / {threshold} voix
                        </span>
                      </div>
                      {!isAuthor && (
                        <div className="flex w-full gap-3 sm:w-auto">
                          <button
                            type="button"
                            onClick={() => handleVote(s.id, true)}
                            disabled={myVote?.approve === true}
                            className="min-h-12 flex-1 rounded-lg bg-success-solid px-5 font-semibold text-white transition-opacity disabled:opacity-60 sm:flex-none"
                          >
                            Je suis d&apos;accord
                          </button>
                          <button
                            type="button"
                            onClick={() => handleVote(s.id, false)}
                            disabled={myVote?.approve === false}
                            className="min-h-12 flex-1 rounded-lg border-[1.5px] border-danger px-5 font-semibold text-danger transition-opacity disabled:opacity-60 sm:flex-none"
                          >
                            Pas d&apos;accord
                          </button>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      ))}
    </section>
  );
}
