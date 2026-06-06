export type RedactionErrorCode = "INVALID_TERMS" | "INVALID_KEY" | "PLACEHOLDER_MISMATCH";

export interface RedactionTerm {
  value: string;
  kind: "keyword" | "phrase";
}

export interface RedactionEntry {
  index: number;
  start: number;
  end: number;
  term: string;
  original: string;
}

export interface RedactionResult {
  redactedText: string;
  key: string;
  redactions: RedactionEntry[];
}

export interface UnredactionResult {
  unredactedText: string;
}
