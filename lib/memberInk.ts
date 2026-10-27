const INK_COUNT = 6;

/** Couleur d'encre stable d'un membre, tirée de son prénom (voir --ink-N dans globals.css). */
export function memberInk(name: string): string {
  let hash = 0;
  for (const char of name) {
    hash = (hash * 31 + char.charCodeAt(0)) >>> 0;
  }
  return `var(--ink-${(hash % INK_COUNT) + 1})`;
}
