"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { memberInk } from "@/lib/memberInk";
import type { CommentData } from "./types";

export default function FamilyNotes({
  recipeId,
  notes,
}: {
  recipeId: string;
  notes: CommentData[];
}) {
  const router = useRouter();
  const [body, setBody] = useState("");
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!body.trim()) return;
    setSubmitting(true);
    try {
      const res = await fetch("/api/comments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ recipeId, body, field: "GENERAL" }),
      });
      if (!res.ok) throw new Error();
      setBody("");
      router.refresh();
    } catch {
      alert("Erreur lors de l'envoi du commentaire");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <section aria-labelledby="notes-title" className="mt-10">
      <h2 id="notes-title" className="font-heading mb-3 text-2xl font-semibold md:text-[26px]">
        Mots de la famille
      </h2>

      <div className="flex flex-col gap-3">
        {notes.length === 0 && (
          <p className="text-muted">Aucun mot pour le moment. Soyez le premier !</p>
        )}
        {notes.map((n) => (
          <div key={n.id} className="rounded-[10px] border border-line bg-surface px-4 py-3 md:px-[18px]">
            <div className="flex flex-wrap items-baseline gap-2">
              <strong style={{ color: memberInk(n.author.name) }}>{n.author.name}</strong>
              <span className="text-sm text-muted">
                {new Date(n.createdAt).toLocaleDateString("fr-FR", { day: "numeric", month: "long" })}
              </span>
            </div>
            <div className="whitespace-pre-wrap">{n.body}</div>
          </div>
        ))}
      </div>

      <form onSubmit={handleSubmit} className="mt-4">
        <label htmlFor="family-note" className="mb-1 block text-sm font-medium">
          Laisser un mot
        </label>
        <textarea
          id="family-note"
          value={body}
          onChange={(e) => setBody(e.target.value)}
          className="field mb-3"
          placeholder="Un commentaire, une astuce, un souvenir..."
          rows={3}
        />
        <button
          type="submit"
          disabled={submitting || !body.trim()}
          className="min-h-12 rounded-lg bg-primary px-6 font-semibold text-on-primary transition-colors hover:bg-primary-hover disabled:opacity-50"
        >
          {submitting ? "Envoi..." : "Envoyer"}
        </button>
      </form>
    </section>
  );
}
