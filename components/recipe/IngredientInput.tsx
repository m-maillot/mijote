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
    <div className="group bg-cream/50 rounded-lg p-2 border border-cream-dark/50">
      <div className="flex items-center gap-2">
        <div className="flex flex-col gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
          <button
            type="button"
            onClick={onMoveUp}
            disabled={index === 0}
            className="text-brown-light hover:text-brown disabled:opacity-20 text-xs leading-none"
            title="Monter"
          >
            ▲
          </button>
          <button
            type="button"
            onClick={onMoveDown}
            disabled={index === total - 1}
            className="text-brown-light hover:text-brown disabled:opacity-20 text-xs leading-none"
            title="Descendre"
          >
            ▼
          </button>
        </div>

        <input
          type="text"
          value={ingredient.quantity}
          onChange={(e) => onChange("quantity", e.target.value)}
          className="input-hand w-14 shrink-0 text-center text-lg"
          placeholder="Qté"
        />

        <select
          value={ingredient.unit}
          onChange={(e) => onChange("unit", e.target.value)}
          className="input-hand w-24 shrink-0"
        >
          {COMMON_UNITS.map((u) => (
            <option key={u} value={u}>
              {u || "—"}
            </option>
          ))}
        </select>

        <input
          type="text"
          value={ingredient.name}
          onChange={(e) => onChange("name", e.target.value)}
          className="input-hand flex-1 text-lg"
          placeholder="Nom de l'ingrédient..."
        />

        <button
          type="button"
          onClick={onRemove}
          disabled={total <= 1}
          className="text-red/50 hover:text-red disabled:opacity-20 transition-colors text-lg px-1"
          title="Supprimer"
        >
          ×
        </button>
      </div>
    </div>
  );
}
