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

export class RedactionError extends Error {
  constructor(
    message: string,
    public readonly code: "INVALID_TERMS" | "INVALID_KEY" | "PLACEHOLDER_MISMATCH"
  ) {
    super(message);
    this.name = "RedactionError";
  }
}
