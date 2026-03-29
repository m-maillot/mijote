"use client";

import { diffLines, diffIngredients } from "@/lib/diff";

interface IngredientItem {
  quantity?: string | null;
  unit?: string | null;
  name: string;
}

interface DiffViewProps {
  comment: {
    body: string;
    field: string;
  };
  recipe: {
    title: string;
    ingredients: IngredientItem[];
    steps: string;
  };
}

export default function DiffView({ comment, recipe }: DiffViewProps) {
  if (comment.field === "GENERAL") {
    return (
      <div className="font-[family-name:var(--font-hand)] text-lg text-brown whitespace-pre-wrap">
        {comment.body}
      </div>
    );
  }

  if (comment.field === "TITLE") {
    const oldTitle = recipe.title;
    const newTitle = comment.body;
    if (oldTitle === newTitle) {
      return <div className="font-[family-name:var(--font-hand)] text-lg text-brown">{newTitle}</div>;
    }
    return (
      <div className="space-y-1 text-sm">
        <div className="flex items-center gap-2">
          <span className="bg-red/15 text-red px-2 py-0.5 rounded font-mono text-xs shrink-0">−</span>
          <span className="line-through text-red/70 font-[family-name:var(--font-hand)] text-lg">{oldTitle}</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="bg-green/15 text-green px-2 py-0.5 rounded font-mono text-xs shrink-0">+</span>
          <span className="text-green font-[family-name:var(--font-hand)] text-lg">{newTitle}</span>
        </div>
      </div>
    );
  }

  if (comment.field === "INGREDIENTS") {
    let suggestedIngs: IngredientItem[];
    try {
      suggestedIngs = JSON.parse(comment.body);
    } catch {
      return (
        <div className="font-[family-name:var(--font-hand)] text-lg text-brown whitespace-pre-wrap">
          {comment.body}
        </div>
      );
    }

    const diffs = diffIngredients(recipe.ingredients, suggestedIngs);
    const hasChanges = diffs.some((d) => d.type !== "same");

    if (!hasChanges) {
      return <div className="text-brown-light text-sm">Aucune modification</div>;
    }

    return (
      <div className="space-y-0.5">
        {diffs.map((d, i) => {
          if (d.type === "same") {
            return (
              <div key={i} className="flex items-center gap-2 py-0.5">
                <span className="w-5 shrink-0" />
                <span className="font-[family-name:var(--font-hand)] text-lg text-brown">{d.value}</span>
              </div>
            );
          }
          if (d.type === "removed") {
            return (
              <div key={i} className="flex items-center gap-2 py-0.5 bg-red/5 rounded">
                <span className="bg-red/15 text-red px-1.5 py-0.5 rounded font-mono text-xs shrink-0">−</span>
                <span className="font-[family-name:var(--font-hand)] text-lg text-red/70 line-through">{d.oldValue}</span>
              </div>
            );
          }
          if (d.type === "added") {
            return (
              <div key={i} className="flex items-center gap-2 py-0.5 bg-green/5 rounded">
                <span className="bg-green/15 text-green px-1.5 py-0.5 rounded font-mono text-xs shrink-0">+</span>
                <span className="font-[family-name:var(--font-hand)] text-lg text-green">{d.newValue}</span>
              </div>
            );
          }
          return null;
        })}
      </div>
    );
  }

  if (comment.field === "STEPS") {
    const diffs = diffLines(recipe.steps, comment.body);
    const hasChanges = diffs.some((d) => d.type !== "same");

    if (!hasChanges) {
      return <div className="text-brown-light text-sm">Aucune modification</div>;
    }

    return (
      <div className="space-y-0.5">
        {diffs.map((d, i) => {
          if (d.type === "same") {
            return (
              <div key={i} className="flex items-center gap-2 py-0.5">
                <span className="w-5 shrink-0" />
                <span className="font-[family-name:var(--font-hand)] text-lg text-brown">{d.value}</span>
              </div>
            );
          }
          if (d.type === "removed") {
            return (
              <div key={i} className="flex items-center gap-2 py-0.5 bg-red/5 rounded">
                <span className="bg-red/15 text-red px-1.5 py-0.5 rounded font-mono text-xs shrink-0">−</span>
                <span className="font-[family-name:var(--font-hand)] text-lg text-red/70 line-through">{d.value}</span>
              </div>
            );
          }
          if (d.type === "added") {
            return (
              <div key={i} className="flex items-center gap-2 py-0.5 bg-green/5 rounded">
                <span className="bg-green/15 text-green px-1.5 py-0.5 rounded font-mono text-xs shrink-0">+</span>
                <span className="font-[family-name:var(--font-hand)] text-lg text-green">{d.value}</span>
              </div>
            );
          }
          return null;
        })}
      </div>
    );
  }

  return (
    <div className="font-[family-name:var(--font-hand)] text-lg text-brown whitespace-pre-wrap">
      {comment.body}
    </div>
  );
}
