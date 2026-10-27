"use client";

import type { IngredientData } from "./RecipeForm";

const COMMON_UNITS = ["", "g", "kg", "cl", "ml", "L", "c. à soupe", "c. à café", "pincée", "sachet", "tranche", "gousse", "bouteille", "verre"];

interface IngredientInputProps {
  ingredient: IngredientData;
  index: number;
  total: number;
  onChange: (field: keyof IngredientData, value: string) => void;
  onRemove: () => void;
  onMoveUp: () => void;
  onMoveDown: () => void;
}

export default function IngredientInput({
  ingredient,
  index,
  total,
  onChange,
  onRemove,
  onMoveUp,
  onMoveDown,
}: IngredientInputProps) {
  return (
    <div className="group rounded-lg border border-line bg-surface p-2">
      <div className="flex flex-wrap items-center gap-2">
        <div className="flex flex-col md:opacity-0 md:transition-opacity md:group-focus-within:opacity-100 md:group-hover:opacity-100">
          <button
            type="button"
            onClick={onMoveUp}
            disabled={index === 0}
            className="px-2 py-1 text-xs leading-none text-muted hover:text-ink disabled:opacity-30"
            title="Monter"
            aria-label="Monter l'ingrédient"
          >
            ▲
          </button>
          <button
            type="button"
            onClick={onMoveDown}
            disabled={index === total - 1}
            className="px-2 py-1 text-xs leading-none text-muted hover:text-ink disabled:opacity-30"
            title="Descendre"
            aria-label="Descendre l'ingrédient"
          >
            ▼
          </button>
        </div>

        <input
          type="text"
          value={ingredient.quantity}
          onChange={(e) => onChange("quantity", e.target.value)}
          className="field w-20 shrink-0 px-2 text-center"
          placeholder="Qté"
          aria-label="Quantité"
        />

        <select
          value={ingredient.unit}
          onChange={(e) => onChange("unit", e.target.value)}
          className="field w-28 shrink-0 px-2"
          aria-label="Unité"
        >
          {(COMMON_UNITS.includes(ingredient.unit) ? COMMON_UNITS : [...COMMON_UNITS, ingredient.unit]).map((u) => (
            <option key={u} value={u}>
              {u || "—"}
            </option>
          ))}
        </select>

        <input
          type="text"
          value={ingredient.name}
          onChange={(e) => onChange("name", e.target.value)}
          className="field min-w-40 flex-1"
          placeholder="Nom de l'ingrédient"
          aria-label="Nom de l'ingrédient"
        />

        <button
          type="button"
          onClick={onRemove}
          disabled={total <= 1}
          className="flex h-12 w-12 items-center justify-center text-2xl text-danger transition-colors hover:bg-danger/10 disabled:opacity-30"
          title="Supprimer"
          aria-label="Supprimer l'ingrédient"
        >
          ×
        </button>
      </div>
    </div>
  );
}
