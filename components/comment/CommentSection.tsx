"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import IngredientInput from "../recipe/IngredientInput";
import type { IngredientData } from "../recipe/RecipeForm";
import DiffView from "./DiffView";

interface Vote {
  memberId: string;
  approve: boolean;
}

interface IngredientItem {
  quantity?: string | null;
  unit?: string | null;
  name: string;
}

interface CommentData {
  id: string;
  body: string;
  field: string;
  status: string;
  createdAt: string;
  author: { id: string; name: string };
  votes: Vote[];
}

interface CommentSectionProps {
  recipeId: string;
  comments: CommentData[];
  currentMemberId: string;
  recipe: {
    title: string;
    ingredients: IngredientItem[];
    steps: string;
  };
}

export default function CommentSection({ recipeId, comments, currentMemberId, recipe }: CommentSectionProps) {
  const router = useRouter();
  const [body, setBody] = useState("");
  const [field, setField] = useState<string>("GENERAL");
  const [suggestedIngredients, setSuggestedIngredients] = useState<IngredientData[]>(
    recipe.ingredients.map((i) => ({
      quantity: i.quantity || "",
      unit: i.unit || "",
      name: i.name,
    }))
  );
  const [submitting, setSubmitting] = useState(false);

  const fieldLabels: Record<string, string> = {
    GENERAL: "Commentaire général",
    TITLE: "Suggestion de titre",
    INGREDIENTS: "Suggestion d'ingrédients",
    STEPS: "Suggestion de préparation",
  };

  const statusLabels: Record<string, { label: string; className: string }> = {
    PENDING: { label: "En attente", className: "bg-amber/20 text-amber" },
    APPROVED: { label: "Approuvé", className: "bg-green/20 text-green" },
    REJECTED: { label: "Rejeté", className: "bg-red/20 text-red" },
  };

  function handleFieldChange(newField: string) {
    setField(newField);
    if (newField === "INGREDIENTS") {
      setSuggestedIngredients(
        recipe.ingredients.map((i) => ({
          quantity: i.quantity || "",
          unit: i.unit || "",
          name: i.name,
        }))
      );
      setBody("");
    } else if (newField === "STEPS") {
      setBody(recipe.steps);
    } else if (newField === "TITLE") {
      setBody(recipe.title);
    } else {
      setBody("");
    }
  }

  function addSuggestedIngredient() {
    setSuggestedIngredients([...suggestedIngredients, { quantity: "", unit: "", name: "" }]);
  }

  function updateSuggestedIngredient(index: number, key: keyof IngredientData, value: string) {
    const updated = [...suggestedIngredients];
    updated[index] = { ...updated[index], [key]: value };
    setSuggestedIngredients(updated);
  }

  function removeSuggestedIngredient(index: number) {
    if (suggestedIngredients.length <= 1) return;
    setSuggestedIngredients(suggestedIngredients.filter((_, i) => i !== index));
  }

  function moveSuggestedIngredient(index: number, direction: -1 | 1) {
    const newIndex = index + direction;
    if (newIndex < 0 || newIndex >= suggestedIngredients.length) return;
    const updated = [...suggestedIngredients];
    [updated[index], updated[newIndex]] = [updated[newIndex], updated[index]];
    setSuggestedIngredients(updated);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);

    let commentBody = body;
    if (field === "INGREDIENTS") {
      const validIngs = suggestedIngredients.filter((i) => i.name.trim());
      if (validIngs.length === 0) {
        alert("Ajoutez au moins un ingrédient");
        setSubmitting(false);
        return;
      }
      commentBody = JSON.stringify(validIngs);
    } else if (!commentBody.trim()) {
      setSubmitting(false);
      return;
    }

    try {
      const res = await fetch("/api/comments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ recipeId, body: commentBody, field }),
      });
      if (!res.ok) throw new Error();
      setBody("");
      setField("GENERAL");
      router.refresh();
    } catch {
      alert("Erreur lors de l'envoi du commentaire");
    } finally {
      setSubmitting(false);
    }
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
    <div className="mt-10">
      <h2 className="font-[family-name:var(--font-hand)] text-3xl text-brown mb-6">
        Commentaires & Suggestions
      </h2>

      {/* Comment form */}
      <form onSubmit={handleSubmit} className="bg-white/70 rounded-xl p-5 border border-cream-dark mb-8">
        <div className="mb-3">
          <label className="text-sm text-brown-light block mb-1">Type de commentaire</label>
          <select
            value={field}
            onChange={(e) => handleFieldChange(e.target.value)}
            className="bg-transparent border border-cream-dark rounded-lg px-3 py-2 text-sm text-brown w-full"
          >
            {Object.entries(fieldLabels).map(([key, label]) => (
              <option key={key} value={key}>{label}</option>
            ))}
          </select>
        </div>

        {field !== "GENERAL" && field !== "INGREDIENTS" && (
          <p className="text-xs text-brown-light/70 mb-2">
            Modifiez le texte ci-dessous avec votre suggestion. Si elle est approuvée par 2 membres, la recette sera mise à jour.
          </p>
        )}

        {field === "INGREDIENTS" ? (
          <div className="mb-3">
            <p className="text-xs text-brown-light/70 mb-3">
              Modifiez les ingrédients ci-dessous. Si votre suggestion est approuvée par 2 membres, la recette sera mise à jour.
            </p>
            <div className="space-y-2">
              {suggestedIngredients.map((ing, index) => (
                <IngredientInput
                  key={index}
                  ingredient={ing}
                  index={index}
                  total={suggestedIngredients.length}
                  onChange={(f, v) => updateSuggestedIngredient(index, f, v)}
                  onRemove={() => removeSuggestedIngredient(index)}
                  onMoveUp={() => moveSuggestedIngredient(index, -1)}
                  onMoveDown={() => moveSuggestedIngredient(index, 1)}
                />
              ))}
            </div>
            <button
              type="button"
              onClick={addSuggestedIngredient}
              className="mt-2 text-brown-light hover:text-brown font-[family-name:var(--font-hand)] text-lg transition-colors flex items-center gap-1"
            >
              <span className="text-xl">+</span> Ajouter un ingrédient
            </button>
          </div>
        ) : (
          <textarea
            value={body}
            onChange={(e) => setBody(e.target.value)}
            className="textarea-hand mb-3"
            placeholder={field === "GENERAL" ? "Un commentaire, une astuce, un souvenir..." : "Votre suggestion..."}
            rows={4}
            required={field !== "INGREDIENTS"}
          />
        )}

        <button
          type="submit"
          disabled={submitting}
          className="bg-brown text-cream px-6 py-2 rounded-xl font-[family-name:var(--font-hand)] text-lg hover:bg-brown-light transition-colors disabled:opacity-50"
        >
          {submitting ? "Envoi..." : "Envoyer"}
        </button>
      </form>

      {/* Comments list */}
      {comments.length === 0 ? (
        <p className="text-brown-light text-center py-4">Aucun commentaire pour le moment</p>
      ) : (
        <div className="space-y-4">
          {comments.map((comment) => {
            const approves = comment.votes.filter((v) => v.approve).length;
            const rejects = comment.votes.filter((v) => !v.approve).length;
            const myVote = comment.votes.find((v) => v.memberId === currentMemberId);
            const isAuthor = comment.author.id === currentMemberId;
            const status = statusLabels[comment.status];

            return (
              <div
                key={comment.id}
                className="bg-white/60 rounded-xl p-4 border border-cream-dark"
              >
                <div className="flex items-start justify-between mb-2 flex-wrap gap-2">
                  <div>
                    <span className="font-[family-name:var(--font-hand)] text-lg text-brown">
                      {comment.author.name}
                    </span>
                    <span className="text-xs text-brown-light ml-2">
                      {new Date(comment.createdAt).toLocaleDateString("fr-FR", {
                        day: "numeric",
                        month: "long",
                      })}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs px-2 py-0.5 rounded-full bg-cream-dark text-brown-light">
                      {fieldLabels[comment.field]}
                    </span>
                    <span className={`text-xs px-2 py-0.5 rounded-full ${status.className}`}>
                      {status.label}
                    </span>
                  </div>
                </div>

                {/* Diff view for suggestions, plain text for general comments */}
                <DiffView comment={comment} recipe={recipe} />

                {comment.status === "PENDING" && (
                  <div className="flex items-center gap-3 text-sm mt-3">
                    {!isAuthor && (
                      <>
                        <button
                          onClick={() => handleVote(comment.id, true)}
                          disabled={myVote?.approve === true}
                          className={`flex items-center gap-1 px-3 py-1 rounded-lg transition-colors ${
                            myVote?.approve === true
                              ? "bg-green/20 text-green"
                              : "bg-cream-dark text-brown-light hover:bg-green/20 hover:text-green"
                          }`}
                        >
                          Approuver ({approves})
                        </button>
                        <button
                          onClick={() => handleVote(comment.id, false)}
                          disabled={myVote?.approve === false}
                          className={`flex items-center gap-1 px-3 py-1 rounded-lg transition-colors ${
                            myVote?.approve === false
                              ? "bg-red/20 text-red"
                              : "bg-cream-dark text-brown-light hover:bg-red/20 hover:text-red"
                          }`}
                        >
                          Rejeter ({rejects})
                        </button>
                      </>
                    )}
                    {isAuthor && (
                      <span className="text-brown-light/60">
                        Approuvé par {approves} personne{approves > 1 ? "s" : ""}
                      </span>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
