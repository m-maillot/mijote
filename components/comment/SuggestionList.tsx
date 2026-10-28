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

export default function SuggestionList({
  suggestions,
  currentMemberId,
  recipe,
}: {
  suggestions: CommentData[];
  currentMemberId: string;
  recipe: RecipeSnapshot;
}) {
  const router = useRouter();

  if (suggestions.length === 0) return null;

  const byAuthor = new Map<string, { name: string; items: CommentData[] }>();
  for (const s of suggestions) {
    const group = byAuthor.get(s.author.id) ?? { name: s.author.name, items: [] };
    group.items.push(s);
    byAuthor.set(s.author.id, group);
  }

  async function handleToggleLike(commentId: string, liked: boolean) {
    try {
      const res = await fetch(`/api/comments/${commentId}/vote`, {
        method: liked ? "DELETE" : "POST",
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
              const likers = s.votes.filter((v) => v.approve);
              const liked = likers.some((v) => v.memberId === currentMemberId);
              const isAuthor = s.author.id === currentMemberId;

              return (
                <div key={s.id} className="py-4 first:pt-0 last:pb-0">
                  <div className="mb-2 flex flex-wrap items-center gap-2 text-sm">
                    <span className="rounded-full bg-subtle px-2.5 py-0.5 text-muted">
                      {fieldLabels[s.field]}
                    </span>
                    <span className="text-muted">
                      {new Date(s.createdAt).toLocaleDateString("fr-FR", { day: "numeric", month: "long" })}
                    </span>
                  </div>

                  <DiffView comment={s} recipe={recipe} />

                  <div className="mt-4 flex items-center gap-3">
                    {isAuthor ? (
                      <span className="text-sm text-muted">
                        {likers.length} {likers.length > 1 ? "pouces" : "pouce"}
                      </span>
                    ) : (
                      <button
                        type="button"
                        onClick={() => handleToggleLike(s.id, liked)}
                        aria-pressed={liked}
                        aria-label={liked ? "Retirer mon pouce" : "Je suis d'accord avec cette suggestion"}
                        className={`inline-flex min-h-12 items-center gap-2 rounded-lg border-[1.5px] px-5 font-semibold transition-colors ${
                          liked
                            ? "border-success-solid bg-success-solid text-white"
                            : "border-success-solid text-success"
                        }`}
                      >
                        <svg width="20" height="20" viewBox="0 0 24 24" fill={liked ? "currentColor" : "none"} stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                          <path d="M7 10v11H3V10h4zM7 10l4-8a2.5 2.5 0 0 1 2.5 2.5V8H20a2 2 0 0 1 2 2.3l-1.4 9A2 2 0 0 1 18.6 21H7" />
                        </svg>
                        {likers.length > 0 && <span>{likers.length}</span>}
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      ))}
    </section>
  );
}
