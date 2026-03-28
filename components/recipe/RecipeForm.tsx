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
  };
}

export default function RecipeForm({ initialData }: RecipeFormProps) {
  const router = useRouter();
  const [title, setTitle] = useState(initialData?.title ?? "");
  const [ingredients, setIngredients] = useState<IngredientData[]>(
    initialData?.ingredients ?? [{ quantity: "", unit: "", name: "" }]
  );
  const [steps, setSteps] = useState(initialData?.steps ?? "");
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
        <label className="font-[family-name:var(--font-hand)] text-2xl text-brown block mb-2">
          Titre de la recette
        </label>
        <input
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          className="input-hand w-full text-2xl"
          placeholder="Ex: Gratin dauphinois de Mamie..."
          required
        />
      </div>

      <div>
        <label className="font-[family-name:var(--font-hand)] text-2xl text-brown block mb-3">
          Ingrédients
        </label>
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
          className="mt-3 text-brown-light hover:text-brown font-[family-name:var(--font-hand)] text-lg transition-colors flex items-center gap-1"
        >
          <span className="text-xl">+</span> Ajouter un ingrédient
        </button>
      </div>

      <div>
        <label className="font-[family-name:var(--font-hand)] text-2xl text-brown block mb-2">
          Préparation
        </label>
        <p className="text-xs text-brown-light mb-2">Une étape par ligne</p>
        <textarea
          value={steps}
          onChange={(e) => setSteps(e.target.value)}
          className="textarea-hand"
          placeholder={"Préchauffer le four à 180°C\nÉplucher et couper les pommes de terre\nFrotter le plat avec l'ail..."}
          rows={10}
          required
        />
      </div>

      {!isEdit && (
        <div>
          <label className="font-[family-name:var(--font-hand)] text-2xl text-brown block mb-2">
            Photo (optionnel)
          </label>
          <input
            type="file"
            accept="image/*"
            onChange={(e) => setPhoto(e.target.files?.[0] ?? null)}
            className="text-sm text-brown-light file:mr-4 file:py-2 file:px-4 file:rounded-xl file:border-0 file:bg-cream-dark file:text-brown file:font-[family-name:var(--font-hand)] file:text-lg file:cursor-pointer hover:file:bg-brown hover:file:text-cream"
          />
        </div>
      )}

      <button
        type="submit"
        disabled={saving}
        className="bg-brown text-cream px-8 py-3 rounded-xl font-[family-name:var(--font-hand)] text-xl hover:bg-brown-light transition-colors disabled:opacity-50"
      >
        {saving ? "Enregistrement..." : isEdit ? "Mettre à jour" : "Ajouter la recette"}
      </button>
    </form>
  );
}
