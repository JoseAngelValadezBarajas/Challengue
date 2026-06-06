export function normalizeRedactedTerm(term: string): string {
  return term.trim().toLocaleLowerCase("en-US");
}
