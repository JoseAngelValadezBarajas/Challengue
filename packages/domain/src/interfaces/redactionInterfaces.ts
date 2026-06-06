import type { REDACTION_ERROR_CODES } from "../constants/redactionConstants.js";

export type RedactionErrorCode = (typeof REDACTION_ERROR_CODES)[keyof typeof REDACTION_ERROR_CODES];

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
