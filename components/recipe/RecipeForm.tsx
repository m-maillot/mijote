"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import IngredientInput from "./IngredientInput";

export interface IngredientData {
  quantity: string;
  unit: string;
  name: string;
}

interface RecipeFormProps {
  initialData?: {
    id: string;
    title: string;
    ingredients: IngredientData[];
    steps: string;
    servings: number;
  };
}

export default function RecipeForm({ initialData }: RecipeFormProps) {
  const router = useRouter();
  const [title, setTitle] = useState(initialData?.title ?? "");
  const [ingredients, setIngredients] = useState<IngredientData[]>(
    initialData?.ingredients ?? [{ quantity: "", unit: "", name: "" }]
  );
  const [steps, setSteps] = useState(initialData?.steps ?? "");
  const [servings, setServings] = useState(String(initialData?.servings ?? 4));
  const [photo, setPhoto] = useState<File | null>(null);
  const [saving, setSaving] = useState(false);

  const isEdit = !!initialData;

  function addIngredient() {
    setIngredients([...ingredients, { quantity: "", unit: "", name: "" }]);
  }

  function updateIngredient(index: number, field: keyof IngredientData, value: string) {
    const updated = [...ingredients];
    updated[index] = { ...updated[index], [field]: value };
    setIngredients(updated);
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
    const validIngredients = ingredients.filter((i) => i.name.trim());
    if (validIngredients.length === 0) {
      alert("Ajoutez au moins un ingrédient");
      return;
    }
    setSaving(true);

    try {
      const url = isEdit ? `/api/recipes/${initialData.id}` : "/api/recipes";
      const method = isEdit ? "PATCH" : "POST";

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title,
          ingredients: validIngredients.map((ing, i) => ({ ...ing, order: i })),
          steps,
          servings: Number(servings) || 4,
        }),
      });

      if (!res.ok) throw new Error("Erreur lors de la sauvegarde");
      const recipe = await res.json();

      if (photo) {
        const formData = new FormData();
        formData.append("photo", photo);
        await fetch(`/api/recipes/${recipe.id}/photo`, {
          method: "POST",
          body: formData,
        });
      }

      router.push(`/recettes/${recipe.id}`);
      router.refresh();
    } catch {
      alert("Erreur lors de la sauvegarde de la recette");
    } finally {
      setSaving(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6 max-w-2xl">
      <div>
        <label htmlFor="title" className="font-heading text-xl font-semibold block mb-2">
          Titre de la recette
        </label>
        <input
          id="title"
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          className="field text-lg"
          placeholder="Ex: Gratin dauphinois de Mamie..."
          required
        />
      </div>

      <div>
        <label htmlFor="servings" className="font-heading text-xl font-semibold block mb-2">
          Nombre de personnes
        </label>
        <input
          id="servings"
          type="number"
          inputMode="numeric"
          min={1}
          max={100}
          value={servings}
          onChange={(e) => setServings(e.target.value)}
          className="field w-28"
          required
        />
      </div>

      <div>
        <p className="font-heading text-xl font-semibold block mb-3">
          Ingrédients
        </p>
        <div className="space-y-2">
          {ingredients.map((ing, index) => (
            <IngredientInput
              key={index}
              ingredient={ing}
              index={index}
              total={ingredients.length}
              onChange={(field, value) => updateIngredient(index, field, value)}
              onRemove={() => removeIngredient(index)}
              onMoveUp={() => moveIngredient(index, -1)}
              onMoveDown={() => moveIngredient(index, 1)}
            />
          ))}
        </div>
        <button
          type="button"
          onClick={addIngredient}
          className="mt-3 flex min-h-11 items-center gap-1 font-medium text-muted transition-colors hover:text-ink"
        >
          <span className="text-xl">+</span> Ajouter un ingrédient
        </button>
      </div>

      <div>
        <label htmlFor="steps" className="font-heading text-xl font-semibold block mb-2">
          Préparation
        </label>
        <p className="text-sm text-muted mb-2">Une étape par ligne</p>
        <textarea
          id="steps"
          value={steps}
          onChange={(e) => setSteps(e.target.value)}
          className="field"
          placeholder={"Préchauffer le four à 180°C\nÉplucher et couper les pommes de terre\nFrotter le plat avec l'ail..."}
          rows={10}
          required
        />
      </div>

      {!isEdit && (
        <div>
          <label htmlFor="photo" className="font-heading text-xl font-semibold block mb-2">
            Photo (optionnel)
          </label>
          <input
            id="photo"
            type="file"
            accept="image/*"
            onChange={(e) => setPhoto(e.target.files?.[0] ?? null)}
            className="text-sm text-muted file:mr-4 file:py-2 file:px-4 file:min-h-11 file:rounded-lg file:border-0 file:bg-subtle file:font-medium file:text-ink file:cursor-pointer hover:file:bg-ink hover:file:text-page"
          />
        </div>
      )}

      <button
        type="submit"
        disabled={saving}
        className="min-h-12 w-full rounded-lg bg-primary px-8 font-semibold text-on-primary transition-colors hover:bg-primary-hover disabled:opacity-50 sm:w-auto"
      >
        {saving ? "Enregistrement..." : isEdit ? "Mettre à jour" : "Ajouter la recette"}
      </button>
    </form>
  );
}
