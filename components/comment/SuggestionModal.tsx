"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import IngredientInput from "../recipe/IngredientInput";
import type { IngredientData } from "../recipe/RecipeForm";
import type { RecipeSnapshot } from "./types";

const fieldLabels: Record<string, string> = {
  TITLE: "Le titre",
  INGREDIENTS: "Les ingrédients",
  STEPS: "La préparation",
};

function toIngredientData(recipe: RecipeSnapshot): IngredientData[] {
  return recipe.ingredients.map((i) => ({
    quantity: i.quantity || "",
    unit: i.unit || "",
    name: i.name,
  }));
}

function initialBody(field: string, recipe: RecipeSnapshot) {
  if (field === "TITLE") return recipe.title;
  if (field === "STEPS") return recipe.steps;
  return "";
}

export default function SuggestionModal({
  recipeId,
  recipe,
  threshold,
}: {
  recipeId: string;
  recipe: RecipeSnapshot;
  threshold: number;
}) {
  const router = useRouter();
  const dialogRef = useRef<HTMLDialogElement>(null);
  const [field, setField] = useState("TITLE");
  const [body, setBody] = useState(recipe.title);
  const [ingredients, setIngredients] = useState<IngredientData[]>(toIngredientData(recipe));
  const [submitting, setSubmitting] = useState(false);

  function reset(newField: string) {
    setField(newField);
    setBody(initialBody(newField, recipe));
    setIngredients(toIngredientData(recipe));
  }

  function open() {
    reset("TITLE");
    dialogRef.current?.showModal();
  }

  function close() {
    dialogRef.current?.close();
  }

  function updateIngredient(index: number, key: keyof IngredientData, value: string) {
    setIngredients(ingredients.map((ing, i) => (i === index ? { ...ing, [key]: value } : ing)));
  }

  function removeIngredient(index: number) {
    if (ingredients.length <= 1) return;
    setIngredients(ingredients.filter((_, i) => i !== index));
  }

  function moveIngredient(index: number, direction: -1 | 1) {
    const newIndex = index + direction;
    if (newIndex < 0 || newIndex >= ingredients.length) return;
    const updated = [...ingredients];
    [updated[index], updated[newIndex]] = [updated[newIndex], updated[index]];
    setIngredients(updated);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    let commentBody = body;
    if (field === "INGREDIENTS") {
      const valid = ingredients.filter((i) => i.name.trim());
      if (valid.length === 0) {
        alert("Ajoutez au moins un ingrédient");
        return;
      }
      commentBody = JSON.stringify(valid);
    } else if (!commentBody.trim()) {
      return;
    }

    setSubmitting(true);
    try {
      const res = await fetch("/api/comments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ recipeId, body: commentBody, field }),
      });
      if (!res.ok) throw new Error();
      close();
      router.refresh();
    } catch {
      alert("Erreur lors de l'envoi de la suggestion");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <>
      <button
        type="button"
        onClick={open}
        className="inline-flex min-h-11 items-center font-semibold underline md:rounded-lg md:border-[1.5px] md:border-ink md:px-[18px] md:no-underline"
      >
        Proposer une modification
      </button>

      <dialog
        ref={dialogRef}
        aria-labelledby="suggestion-title"
        onClick={(e) => {
          if (e.target === dialogRef.current) close();
        }}
        className="m-auto max-h-[90vh] w-[calc(100%-2rem)] max-w-xl overflow-y-auto rounded-xl border border-line bg-surface p-0 text-ink backdrop:bg-black/60"
      >
        <form onSubmit={handleSubmit} className="p-5 md:p-6">
          <div className="mb-4 flex items-start justify-between gap-4">
            <h2 id="suggestion-title" className="font-heading text-2xl font-semibold">
              Proposer une modification
            </h2>
            <button
              type="button"
              onClick={close}
              aria-label="Fermer"
              className="-mr-2 -mt-1 flex h-11 w-11 shrink-0 items-center justify-center rounded-lg text-2xl text-muted hover:text-ink"
            >
              ×
            </button>
          </div>

          <div className="mb-4">
            <label htmlFor="suggestion-type" className="mb-1 block text-sm font-medium">
              Ce que vous voulez changer
            </label>
            <select
              id="suggestion-type"
              value={field}
              onChange={(e) => reset(e.target.value)}
              className="field"
            >
              {Object.entries(fieldLabels).map(([key, label]) => (
                <option key={key} value={key}>{label}</option>
              ))}
            </select>
          </div>

          <p className="mb-3 text-sm text-muted">
            Modifiez le contenu ci-dessous. Si {threshold} membres sont d&apos;accord, la recette sera mise à jour.
          </p>

          {field === "INGREDIENTS" ? (
            <div className="mb-4">
              <div className="space-y-2">
                {ingredients.map((ing, index) => (
                  <IngredientInput
                    key={index}
                    ingredient={ing}
                    index={index}
                    total={ingredients.length}
                    onChange={(f, v) => updateIngredient(index, f, v)}
                    onRemove={() => removeIngredient(index)}
                    onMoveUp={() => moveIngredient(index, -1)}
                    onMoveDown={() => moveIngredient(index, 1)}
                  />
                ))}
              </div>
              <button
                type="button"
                onClick={() => setIngredients([...ingredients, { quantity: "", unit: "", name: "" }])}
                className="mt-2 flex min-h-11 items-center gap-1 font-medium text-muted transition-colors hover:text-ink"
              >
                <span className="text-xl">+</span> Ajouter un ingrédient
              </button>
            </div>
          ) : (
            <textarea
              value={body}
              onChange={(e) => setBody(e.target.value)}
              className="field mb-4"
              rows={field === "STEPS" ? 8 : 2}
              aria-label="Votre suggestion"
              required
            />
          )}

          <div className="flex flex-wrap justify-end gap-3">
            <button
              type="button"
              onClick={close}
              className="min-h-12 rounded-lg border-[1.5px] border-line-strong px-6 font-semibold"
            >
              Annuler
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="min-h-12 rounded-lg bg-primary px-6 font-semibold text-on-primary transition-colors hover:bg-primary-hover disabled:opacity-50"
            >
              {submitting ? "Envoi..." : "Envoyer la suggestion"}
            </button>
          </div>
        </form>
      </dialog>
    </>
  );
}
