"use client";

import { useState } from "react";

interface IngredientItem {
  id: string;
  quantity?: string | null;
  unit?: string | null;
  name: string;
}

export default function IngredientList({ ingredients }: { ingredients: IngredientItem[] }) {
  const [checked, setChecked] = useState<Set<string>>(new Set());

  function toggle(id: string) {
    setChecked((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  return (
    <ul>
      {ingredients.map((ing) => {
        const done = checked.has(ing.id);
        return (
          <li key={ing.id} className="border-b border-line">
            <label className="flex min-h-12 cursor-pointer items-center gap-3 py-2">
              <input
                type="checkbox"
                checked={done}
                onChange={() => toggle(ing.id)}
                className="h-[22px] w-[22px] shrink-0 accent-[var(--ink)]"
              />
              <span className={done ? "text-muted line-through" : ""}>
                {(ing.quantity || ing.unit) && (
                  <span className="mr-1 inline-block min-w-14 font-semibold">
                    {[ing.quantity, ing.unit].filter(Boolean).join(" ")}
                  </span>
                )}
                {ing.name}
              </span>
            </label>
          </li>
        );
      })}
    </ul>
  );
}
