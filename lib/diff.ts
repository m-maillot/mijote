export interface DiffPart {
  type: "same" | "added" | "removed";
  value: string;
}

/**
 * Simple line-based diff between two texts.
 * Returns an array of parts marked as same, added, or removed.
 */
export function diffLines(oldText: string, newText: string): DiffPart[] {
  const oldLines = oldText.split("\n");
  const newLines = newText.split("\n");

  // LCS-based diff
  const m = oldLines.length;
  const n = newLines.length;
  const dp: number[][] = Array.from({ length: m + 1 }, () => Array(n + 1).fill(0));

  for (let i = 1; i <= m; i++) {
    for (let j = 1; j <= n; j++) {
      if (oldLines[i - 1] === newLines[j - 1]) {
        dp[i][j] = dp[i - 1][j - 1] + 1;
      } else {
        dp[i][j] = Math.max(dp[i - 1][j], dp[i][j - 1]);
      }
    }
  }

  const result: DiffPart[] = [];
  let i = m, j = n;
  const stack: DiffPart[] = [];

  while (i > 0 || j > 0) {
    if (i > 0 && j > 0 && oldLines[i - 1] === newLines[j - 1]) {
      stack.push({ type: "same", value: oldLines[i - 1] });
      i--;
      j--;
    } else if (j > 0 && (i === 0 || dp[i][j - 1] >= dp[i - 1][j])) {
      stack.push({ type: "added", value: newLines[j - 1] });
      j--;
    } else {
      stack.push({ type: "removed", value: oldLines[i - 1] });
      i--;
    }
  }

  while (stack.length) {
    result.push(stack.pop()!);
  }

  return result;
}

export interface IngredientDiff {
  type: "same" | "added" | "removed" | "modified";
  oldValue?: string;
  newValue?: string;
  value?: string;
}

/**
 * Diff two lists of ingredients by comparing formatted strings.
 */
export function diffIngredients(
  oldIngs: Array<{ quantity?: string | null; unit?: string | null; name: string }>,
  newIngs: Array<{ quantity?: string | null; unit?: string | null; name: string }>
): IngredientDiff[] {
  const fmt = (i: { quantity?: string | null; unit?: string | null; name: string }) =>
    [i.quantity, i.unit, i.name].filter(Boolean).join(" ");

  const oldStrs = oldIngs.map(fmt);
  const newStrs = newIngs.map(fmt);

  const m = oldStrs.length;
  const n = newStrs.length;
  const dp: number[][] = Array.from({ length: m + 1 }, () => Array(n + 1).fill(0));

  for (let i = 1; i <= m; i++) {
    for (let j = 1; j <= n; j++) {
      if (oldStrs[i - 1] === newStrs[j - 1]) {
        dp[i][j] = dp[i - 1][j - 1] + 1;
      } else {
        dp[i][j] = Math.max(dp[i - 1][j], dp[i][j - 1]);
      }
    }
  }

  const result: IngredientDiff[] = [];
  const stack: IngredientDiff[] = [];
  let i = m, j = n;

  while (i > 0 || j > 0) {
    if (i > 0 && j > 0 && oldStrs[i - 1] === newStrs[j - 1]) {
      stack.push({ type: "same", value: oldStrs[i - 1] });
      i--;
      j--;
    } else if (j > 0 && (i === 0 || dp[i][j - 1] >= dp[i - 1][j])) {
      stack.push({ type: "added", newValue: newStrs[j - 1] });
      j--;
    } else {
      stack.push({ type: "removed", oldValue: oldStrs[i - 1] });
      i--;
    }
  }

  while (stack.length) {
    result.push(stack.pop()!);
  }

  return result;
}
