"use client";

import { useEffect, useRef, useState } from "react";
import type { IngredientData } from "./RecipeForm";

export interface ImportedRecipe {
  title: string;
  servings: number;
  ingredients: IngredientData[];
  steps: string;
}

interface PhotoImportButtonProps {
  onImported: (recipe: ImportedRecipe, warnings: string[], photo: File) => void;
}

const MAX_SIDE = 1600;
const MAX_FILES = 3;

/** Réduit l'image (côté long ≤ 1600 px) et la ré-encode en JPEG pour limiter taille et coût. */
async function shrink(file: File): Promise<File> {
  const bitmap = await createImageBitmap(file);
  const scale = Math.min(1, MAX_SIDE / Math.max(bitmap.width, bitmap.height));
  const canvas = document.createElement("canvas");
  canvas.width = Math.round(bitmap.width * scale);
  canvas.height = Math.round(bitmap.height * scale);
  canvas.getContext("2d")!.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
  bitmap.close();
  const blob = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, "image/jpeg", 0.85));
  if (!blob) throw new Error("Image illisible");
  return new File([blob], "recette.jpg", { type: "image/jpeg" });
}

export default function PhotoImportButton({ onImported }: PhotoImportButtonProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [available, setAvailable] = useState(false);
  const [remaining, setRemaining] = useState<number | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    fetch("/api/recipes/import-photo/quota")
      .then((res) => (res.ok ? res.json() : null))
      .then((quota) => {
        if (!quota) return;
        setAvailable(true);
        setRemaining(quota.remaining);
      })
      .catch(() => {});
  }, []);

  if (!available) return null;

  async function handleFiles(e: React.ChangeEvent<HTMLInputElement>) {
    const files = Array.from(e.target.files ?? []).slice(0, MAX_FILES);
    e.target.value = "";
    if (files.length === 0) return;

    setError("");
    setLoading(true);
    try {
      const photos = await Promise.all(files.map(shrink));
      const formData = new FormData();
      photos.forEach((p) => formData.append("photos", p));

      const res = await fetch("/api/recipes/import-photo", { method: "POST", body: formData });
      const data = await res.json().catch(() => ({}));
      if (typeof data.remaining === "number") setRemaining(data.remaining);
      if (!res.ok) {
        setError(data.error || "L'import a échoué. Réessayez ou saisissez la recette à la main.");
        return;
      }
      onImported(data.recipe, data.warnings ?? [], photos[0]);
    } catch {
      setError("L'import a échoué. Réessayez ou saisissez la recette à la main.");
    } finally {
      setLoading(false);
    }
  }

  const exhausted = remaining === 0;

  return (
    <div className="mb-8 max-w-2xl rounded-lg border border-line bg-surface p-4">
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        capture="environment"
        multiple
        onChange={handleFiles}
        className="hidden"
      />
      <div className="flex flex-wrap items-center gap-3">
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          disabled={loading || exhausted}
          className="min-h-11 rounded-lg border border-line-strong bg-subtle px-5 font-medium text-ink transition-colors hover:bg-ink hover:text-page disabled:opacity-50"
        >
          {loading ? "Lecture de la recette…" : "Depuis une photo"}
        </button>
        {remaining !== null && (
          <span className="text-sm text-muted">
            {remaining} import{remaining > 1 ? "s" : ""} restant{remaining > 1 ? "s" : ""} aujourd&apos;hui
          </span>
        )}
      </div>
      <p className="mt-2 text-sm text-muted">
        Photographiez une recette (jusqu&apos;à {MAX_FILES} pages) : le formulaire sera pré-rempli, vous pourrez le corriger.
      </p>
      {error && (
        <p role="alert" className="mt-2 text-sm font-medium text-ink">
          {error}
        </p>
      )}
    </div>
  );
}
